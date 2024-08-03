const axios = require('axios');
const Redis = require('ioredis');

// Initialize Redis connection
const redis = new Redis(process.env.REDIS_URL);

export default async function handler(req, res) {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const userId = process.env.DISCORD_USER_ID;

  try {
    // Check if profile is cached
    const cachedProfile = await redis.get(userId);
    if (cachedProfile) {
      return res.status(200).json(JSON.parse(cachedProfile));
    }

    // Fetch profile from Discord API
    const profileResponse = await axios.get(`https://discord.com/api/v9/users/@me`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });
    const profile = profileResponse.data;

    // Fetch status from Discord API
    const statusResponse = await axios.get(`https://discord.com/api/v9/users/${userId}`, {
      headers: {
        Authorization: `Bot ${botToken}`,
      },
    });
    const status = statusResponse.data.status;

    // Combine profile and status
    const profileData = {
      id: profile.id,
      username: profile.username,
      discriminator: profile.discriminator,
      avatar: profile.avatar,
      bio: profile.bio,
      status: status,
    };

    // Cache the profile data
    await redis.set(userId, JSON.stringify(profileData), 'EX', 60 * 5); // Cache for 5 minutes

    res.status(200).json(profileData);
  } catch (error) {
    res.status(500).send(error.message);
  }
}

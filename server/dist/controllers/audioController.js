"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAudioTracks = void 0;
const db_1 = require("../config/db");
const getAudioTracks = async (req, res) => {
    try {
        const result = await db_1.pool.query(`SELECT id, title, artist, category, frequency_hz, duration_sec, audio_type, file_url
       FROM audio_tracks
       ORDER BY CASE 
         WHEN id = 'track-ocean-waves-5min' THEN 1
         WHEN id = 'track-alarm-relaxing-5min' THEN 2
         WHEN id = 'track-alpha-theta-focus-5min' THEN 3
         WHEN id = 'track-deep-alpha-15min' THEN 4
         WHEN id = 'track-396hz' THEN 5
         WHEN id = 'track-morning-mist' THEN 6
         WHEN id = 'track-still-waters' THEN 7
         WHEN id = 'track-forest-canopy' THEN 8
         WHEN id = 'track-432hz' THEN 9
         WHEN id = 'track-evening-drift' THEN 10
         ELSE 11 END`);
        res.status(200).json({
            tracks: result.rows
        });
    }
    catch (error) {
        console.error('getAudioTracks error:', error);
        res.status(500).json({ error: 'Failed to load audio tracks.' });
    }
};
exports.getAudioTracks = getAudioTracks;

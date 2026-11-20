-- Migration: Add 4 final approved MP3 audio tracks
INSERT INTO audio_tracks (id, title, artist, category, frequency_hz, duration_sec, audio_type, file_url)
VALUES 
  ('track-ocean-waves-5min', '5 Minute Timer - Relaxing Music with Ocean Waves', 'Medicine to Meditation', 'nature', NULL, 299, 'mp3', '/audio/5-minute-timer-relaxing-music-ocean-waves.mp3'),
  ('track-alarm-relaxing-5min', '5 Minute Timer with Relaxing Music and Alarm', 'Medicine to Meditation', 'ambient', NULL, 309, 'mp3', '/audio/5-minute-timer-relaxing-music-and-alarm.mp3'),
  ('track-alpha-theta-focus-5min', '5-Minute Meditation Music - Alpha & Theta Waves (Binaural Beats for Focus)', 'Brainwave Acoustics', 'binaural', NULL, 340, 'mp3', '/audio/5-minute-meditation-alpha-theta-waves-binaural-beats.mp3'),
  ('track-deep-alpha-15min', 'Deep Alpha Binaural Beats - 15 min Meditation & Relaxation Brainwave Music', 'Brainwave Acoustics', 'binaural', NULL, 910, 'mp3', '/audio/deep-alpha-binaural-beats-15-min-relaxation.mp3')
ON CONFLICT (id) DO UPDATE 
SET title = EXCLUDED.title, artist = EXCLUDED.artist, category = EXCLUDED.category, 
    duration_sec = EXCLUDED.duration_sec, audio_type = EXCLUDED.audio_type, file_url = EXCLUDED.file_url;

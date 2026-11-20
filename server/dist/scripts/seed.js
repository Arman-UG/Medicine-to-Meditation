"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function seed() {
    console.log('Starting CALM database seeding...');
    try {
        // 1. Seed Users (Admin & Demo User)
        const adminPasswordHash = await bcryptjs_1.default.hash('CalmAdmin2026!', 10);
        const userPasswordHash = await bcryptjs_1.default.hash('UserAlex2026!', 10);
        const adminRes = await db_1.pool.query(`INSERT INTO users (email, password_hash, full_name, role, stress_level)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE 
       SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
       RETURNING id, email, role`, ['admin@calm.local', adminPasswordHash, 'Calm Administrator', 'admin', null]);
        console.log('Seeded Admin account:', adminRes.rows[0].email);
        const userRes = await db_1.pool.query(`INSERT INTO users (email, password_hash, full_name, role, stress_level)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email) DO UPDATE 
       SET password_hash = EXCLUDED.password_hash
       RETURNING id, email, role`, ['alex@calm.local', userPasswordHash, 'Alex Rivera', 'user', 'moderate']);
        console.log('Seeded Demo user:', userRes.rows[0].email);
        const userId = userRes.rows[0].id;
        // Seed Renewal Preferences
        await db_1.pool.query(`INSERT INTO renewal_preferences (user_id, preferred_mode, autopay_consent)
       VALUES ($1, 'manual', false)
       ON CONFLICT (user_id) DO NOTHING`, [userId]);
        // Seed Active Demo Subscription for Alex
        const now = new Date();
        const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        await db_1.pool.query(`INSERT INTO subscriptions (user_id, plan_name, amount_paise, status, renewal_type, current_period_start, current_period_end, next_billing_at)
       VALUES ($1, 'Calm Monthly Unlimited', 9900, 'active', 'manual', $2, $3, $3)
       ON CONFLICT (user_id) DO UPDATE
       SET status = 'active', current_period_end = $3`, [userId, now, periodEnd]);
        console.log('Seeded Active Subscription for demo user.');
        // 2. Seed Activities
        const activities = [
            {
                id: 'cyclic-sighing',
                name: 'Cyclic Sighing',
                slug: 'cyclic-sighing',
                description: 'A scientifically validated physiological reset that quickly lowers autonomic arousal through two rapid inhales followed by a prolonged, unforced exhale.',
                category: 'breathing',
                default_duration_sec: 180,
                rhythm_pattern: {
                    inhale1: 2,
                    inhale2: 1.5,
                    hold: 0,
                    exhale: 6,
                    cycles: 18
                },
                step_instructions: [
                    { phase: 'Prepare', title: 'Settle into Comfort', instruction: 'Allow your shoulders to soften. Keep your posture upright yet comfortable. Eyes may be soft or closed.' },
                    { phase: 'Inhale 1', title: 'Deep Inhale', instruction: 'Breathe in smoothly through your nose to fill approximately 80% of your lungs.' },
                    { phase: 'Inhale 2', title: 'Second Sip', instruction: 'Without exhaling, take a second quick sip of air through your nose to open the air sacs.' },
                    { phase: 'Exhale', title: 'Long Slow Sigh', instruction: 'Gently release all the air out through your mouth with a soft, audible sigh. Feel tension melting away.' }
                ],
                what_to_expect: ['Instant Heart Rate Drop', 'Relieves Acute Tension', 'Adaptable & Gentle']
            },
            {
                id: 'box-breathing',
                name: 'Box Breathing (4-4-4-4)',
                slug: 'box-breathing',
                description: 'Four equal phases of breathing to restore mental equilibrium, calm an overactive nervous system, and clear brain fog.',
                category: 'breathing',
                default_duration_sec: 240,
                rhythm_pattern: {
                    inhale: 4,
                    holdIn: 4,
                    exhale: 4,
                    holdOut: 4,
                    cycles: 15
                },
                step_instructions: [
                    { phase: 'Inhale', title: 'Inhale Slowly', instruction: 'Draw air in through your nose for 4 gentle counts. Feel your lower ribs expand.' },
                    { phase: 'Hold', title: 'Soft Retention', instruction: 'Hold the breath gently for 4 counts without locking your throat or straining.' },
                    { phase: 'Exhale', title: 'Smooth Exhale', instruction: 'Exhale steadily through your nose or mouth for 4 counts, releasing all pressure.' },
                    { phase: 'Pause', title: 'Stillness at the Bottom', instruction: 'Remain resting in empty stillness for 4 counts before the next cycle.' }
                ],
                what_to_expect: ['Rhythmic Focus', 'Nervous System Balance', 'Hold Skip Available']
            },
            {
                id: 'long-exhale',
                name: 'Long-Exhale Breathing',
                slug: 'long-exhale',
                description: 'Doubling the length of your exhalation activates the vagus nerve and switches your physiology from fight-or-flight to rest-and-digest.',
                category: 'breathing',
                default_duration_sec: 300,
                rhythm_pattern: {
                    inhale: 4,
                    hold: 1,
                    exhale: 8,
                    cycles: 20
                },
                step_instructions: [
                    { phase: 'Inhale', title: 'Quiet Inhale', instruction: 'Inhale effortlessly through your nose for 4 counts, letting your belly rise.' },
                    { phase: 'Pause', title: 'Brief Pause', instruction: 'Pause momentarily for just 1 count, feeling calm and centered.' },
                    { phase: 'Exhale', title: 'Extended Exhale', instruction: 'Release your breath through slightly parted lips for 8 slow, peaceful counts.' }
                ],
                what_to_expect: ['Vagus Nerve Stimulation', 'Deep Physical Ease', 'Customizable Pace']
            },
            {
                id: 'seated-muscle-release',
                name: 'Seated Muscle Release',
                slug: 'seated-muscle-release',
                description: 'A soothing progressive release that moves attention through the shoulders, neck, jaw, and hands to release physical tightness.',
                category: 'body',
                default_duration_sec: 360,
                rhythm_pattern: null,
                step_instructions: [
                    { phase: 'Step 1', title: 'Shoulders & Neck', instruction: 'Draw your shoulders up gently toward your ears for 3 seconds, then drop them completely. Feel the drop.' },
                    { phase: 'Step 2', title: 'Jaw & Face', instruction: 'Unclench your teeth. Let your tongue rest flat on the floor of your mouth. Soften the space between your eyebrows.' },
                    { phase: 'Step 3', title: 'Hands & Arms', instruction: 'Open your palms facing upward on your lap. Release all gripping in your fingers and forearms.' },
                    { phase: 'Step 4', title: 'Abdomen & Torso', instruction: 'Let your stomach relax outward naturally. Stop holding your belly tight. Let your breath drop low.' },
                    { phase: 'Step 5', title: 'Feet & Ground', instruction: 'Press both feet flat into the floor. Acknowledge the solid earth supporting you completely.' }
                ],
                what_to_expect: ['Dissolves Posture Strain', 'Desk-Friendly Relief', 'No Equipment Needed']
            },
            {
                id: 'grounding-54321',
                name: '5-4-3-2-1 Sensory Grounding',
                slug: 'grounding-54321',
                description: 'An anchor for anxious or spiraling thoughts by systematically returning your awareness to your direct physical surroundings.',
                category: 'grounding',
                default_duration_sec: 300,
                rhythm_pattern: null,
                step_instructions: [
                    { phase: '5 - Vision', title: '5 Things You Can See', instruction: 'Look around your room. Spot 5 distinct objects: a shadow, a plant, a grain of wood, a color, or a reflection.' },
                    { phase: '4 - Touch', title: '4 Things You Can Feel', instruction: 'Notice 4 physical sensations: the texture of your clothes, the temperature of air, feet against your shoes, smooth surface.' },
                    { phase: '3 - Sound', title: '3 Things You Can Hear', instruction: 'Listen closely for 3 background sounds: humming appliances, birds outside, or distant traffic.' },
                    { phase: '2 - Smell', title: '2 Things You Can Smell', instruction: 'Notice 2 aromas around you: fresh air, coffee, rain, or simply your neutral breath.' },
                    { phase: '1 - Taste', title: '1 Thing You Can Taste', instruction: 'Acknowledge the current taste in your mouth, or take a refreshing sip of cool water.' }
                ],
                what_to_expect: ['Cuts Mental Overload', 'Present-Moment Clarity', 'Gentle Self-Paced']
            },
            {
                id: 'guided-body-scan',
                name: 'Guided Body Scan',
                slug: 'guided-body-scan',
                description: 'A mindful journey of warmth and breath flowing from the crown of your head to the tips of your toes, releasing dormant stress.',
                category: 'meditation',
                default_duration_sec: 480,
                rhythm_pattern: null,
                step_instructions: [
                    { phase: 'Head & Eyes', title: 'Crown & Brow', instruction: 'Bring kind awareness to the top of your head and forehead. Let any mental tightness dissolve into space.' },
                    { phase: 'Throat & Shoulders', title: 'Neck & Trapezius', instruction: 'Send your breath into your throat and shoulder blades. Release burdens you may be unconsciously carrying.' },
                    { phase: 'Heart & Chest', title: 'Heart Center', instruction: 'Feel the rhythm of your heart beating reliably. Invite gratitude and calm into your chest.' },
                    { phase: 'Lower Back & Hips', title: 'Core & Pelvis', instruction: 'Allow your lower back to relax into your seat. Soften the hips and lower abdomen.' },
                    { phase: 'Legs & Feet', title: 'Grounded Presence', instruction: 'Notice warmth travelling down your thighs, knees, calves, and soles of your feet. You are safe and grounded.' }
                ],
                what_to_expect: ['Full Body Ease', 'Peaceful Restoration', 'Comfortable Posture']
            }
        ];
        for (const act of activities) {
            await db_1.pool.query(`INSERT INTO activities (id, name, slug, description, category, default_duration_sec, rhythm_pattern, step_instructions, what_to_expect)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name, description = EXCLUDED.description, rhythm_pattern = EXCLUDED.rhythm_pattern, step_instructions = EXCLUDED.step_instructions, what_to_expect = EXCLUDED.what_to_expect`, [act.id, act.name, act.slug, act.description, act.category, act.default_duration_sec, JSON.stringify(act.rhythm_pattern), JSON.stringify(act.step_instructions), JSON.stringify(act.what_to_expect)]);
        }
        console.log(`Seeded ${activities.length} relaxation activities.`);
        // 3. Seed Audio Tracks
        const audioTracks = [
            {
                id: 'track-396hz',
                title: '396 Hz Solfeggio • Tension Dissolve',
                artist: 'Calm Harmonic Series',
                category: 'solfeggio',
                frequency_hz: 396,
                duration_sec: 600,
                audio_type: 'generative',
                file_url: null
            },
            {
                id: 'track-morning-mist',
                title: 'Morning Mountain Mist',
                artist: 'Alpine Solitude',
                category: 'nature',
                frequency_hz: null,
                duration_sec: 480,
                audio_type: 'generative',
                file_url: null
            },
            {
                id: 'track-still-waters',
                title: 'Still Waters & Gentle Lake',
                artist: 'Tranquil Waters',
                category: 'nature',
                frequency_hz: null,
                duration_sec: 540,
                audio_type: 'generative',
                file_url: null
            },
            {
                id: 'track-forest-canopy',
                title: 'Forest Canopy Whispers',
                artist: 'Deep Woods',
                category: 'nature',
                frequency_hz: null,
                duration_sec: 600,
                audio_type: 'generative',
                file_url: null
            },
            {
                id: 'track-432hz',
                title: '432 Hz Natural Harmony',
                artist: 'Sacred Resonances',
                category: 'solfeggio',
                frequency_hz: 432,
                duration_sec: 720,
                audio_type: 'generative',
                file_url: null
            },
            {
                id: 'track-evening-drift',
                title: 'Evening Cloud Drift',
                artist: 'Dusk Ambient',
                category: 'ambient',
                frequency_hz: null,
                duration_sec: 600,
                audio_type: 'generative',
                file_url: null
            },
            {
                id: 'track-ocean-waves-5min',
                title: '5 Minute Timer - Relaxing Music with Ocean Waves',
                artist: 'Medicine to Meditation',
                category: 'nature',
                frequency_hz: null,
                duration_sec: 299,
                audio_type: 'mp3',
                file_url: '/audio/5-minute-timer-relaxing-music-ocean-waves.mp3'
            },
            {
                id: 'track-alarm-relaxing-5min',
                title: '5 Minute Timer with Relaxing Music and Alarm',
                artist: 'Medicine to Meditation',
                category: 'ambient',
                frequency_hz: null,
                duration_sec: 309,
                audio_type: 'mp3',
                file_url: '/audio/5-minute-timer-relaxing-music-and-alarm.mp3'
            },
            {
                id: 'track-alpha-theta-focus-5min',
                title: '5-Minute Meditation Music - Alpha & Theta Waves (Binaural Beats for Focus)',
                artist: 'Brainwave Acoustics',
                category: 'binaural',
                frequency_hz: null,
                duration_sec: 340,
                audio_type: 'mp3',
                file_url: '/audio/5-minute-meditation-alpha-theta-waves-binaural-beats.mp3'
            },
            {
                id: 'track-deep-alpha-15min',
                title: 'Deep Alpha Binaural Beats - 15 min Meditation & Relaxation Brainwave Music',
                artist: 'Brainwave Acoustics',
                category: 'binaural',
                frequency_hz: null,
                duration_sec: 910,
                audio_type: 'mp3',
                file_url: '/audio/deep-alpha-binaural-beats-15-min-relaxation.mp3'
            }
        ];
        for (const track of audioTracks) {
            await db_1.pool.query(`INSERT INTO audio_tracks (id, title, artist, category, frequency_hz, duration_sec, audio_type, file_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE
         SET title = EXCLUDED.title, artist = EXCLUDED.artist, category = EXCLUDED.category, frequency_hz = EXCLUDED.frequency_hz`, [track.id, track.title, track.artist, track.category, track.frequency_hz, track.duration_sec, track.audio_type, track.file_url]);
        }
        console.log(`Seeded ${audioTracks.length} audio tracks.`);
        console.log('Database seeding successfully finished!');
    }
    catch (error) {
        console.error('Error during database seeding:', error);
        process.exit(1);
    }
    finally {
        await db_1.pool.end();
    }
}
seed();

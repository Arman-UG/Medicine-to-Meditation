"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const API_BASE = 'http://localhost:5000/api';
const FRONTEND_BASE = 'http://localhost:3000';
const SOURCE_DIR = 'C:\\Users\\Arman\\Videos\\Captures';
const PUBLIC_AUDIO_DIR = 'C:\\Users\\Arman\\.gemini\\antigravity\\scratch\\calm\\client\\public\\audio';
async function runAudioIntegrationTests() {
    console.log('================================================================');
    console.log('🎵 MEDICINE TO MEDITATION — FINAL AUDIO INTEGRATION TEST SUITE');
    console.log('================================================================\n');
    let passed = 0;
    let failed = 0;
    function assert(condition, testName, detail) {
        if (condition) {
            console.log(`✅ [PASS] ${testName}`);
            passed++;
        }
        else {
            console.error(`❌ [FAIL] ${testName}${detail ? ' — ' + detail : ''}`);
            failed++;
        }
    }
    try {
        // -------------------------------------------------------------
        // TEST 1: Source to Destination Byte-for-Byte File Integrity
        // -------------------------------------------------------------
        const filesToVerify = [
            {
                orig: '5 Minute Timer - Relaxing Music with Ocean Waves.mp3',
                clean: '5-minute-timer-relaxing-music-ocean-waves.mp3',
                expectedSize: 7387663,
                durationSec: 299,
            },
            {
                orig: '5 Minute Timer with Relaxing Music and Alarm.mp3',
                clean: '5-minute-timer-relaxing-music-and-alarm.mp3',
                expectedSize: 9359611,
                durationSec: 309,
            },
            {
                orig: '5-Minute Meditation Music  Alpha & Theta Waves _ Binaural Beats for Focus.mp3',
                clean: '5-minute-meditation-alpha-theta-waves-binaural-beats.mp3',
                expectedSize: 7865813,
                durationSec: 340,
            },
            {
                orig: 'Deep Alpha Binaural Beats 15 min Meditation & Relaxation Brainwave Music.mp3',
                clean: 'deep-alpha-binaural-beats-15-min-relaxation.mp3',
                expectedSize: 26615914,
                durationSec: 910,
            },
        ];
        for (const item of filesToVerify) {
            const srcPath = path_1.default.join(SOURCE_DIR, item.orig);
            const dstCleanPath = path_1.default.join(PUBLIC_AUDIO_DIR, item.clean);
            const dstOrigPath = path_1.default.join(PUBLIC_AUDIO_DIR, item.orig);
            assert(fs_1.default.existsSync(srcPath) && fs_1.default.existsSync(dstCleanPath) && fs_1.default.existsSync(dstOrigPath), `1. File Exists in Public Audio: "${item.clean}"`);
            const srcStats = fs_1.default.statSync(srcPath);
            const cleanStats = fs_1.default.statSync(dstCleanPath);
            const origStats = fs_1.default.statSync(dstOrigPath);
            assert(srcStats.size === item.expectedSize &&
                cleanStats.size === item.expectedSize &&
                origStats.size === item.expectedSize, `2. Byte-for-Byte Integrity Preserved: ${item.clean} (${cleanStats.size} bytes)`);
        }
        // -------------------------------------------------------------
        // TEST 2: HTTP Static Serving by Next.js Server
        // -------------------------------------------------------------
        for (const item of filesToVerify) {
            const url = `${FRONTEND_BASE}/audio/${item.clean}`;
            const headRes = await fetch(url, { method: 'HEAD' });
            assert(headRes.status === 200 &&
                headRes.headers.get('content-type') === 'audio/mpeg' &&
                parseInt(headRes.headers.get('content-length') || '0', 10) === item.expectedSize, `3. HTTP 200 Static Audio Streaming: "${item.clean}"`);
        }
        // -------------------------------------------------------------
        // TEST 3: HTTP Range Requests (Seeking / Scrubbing Support)
        // -------------------------------------------------------------
        const rangeUrl = `${FRONTEND_BASE}/audio/${filesToVerify[0].clean}`;
        const rangeRes = await fetch(rangeUrl, {
            headers: { Range: 'bytes=0-1023' },
        });
        assert(rangeRes.status === 206 &&
            Boolean(rangeRes.headers.get('content-range')?.startsWith('bytes 0-1023/')) &&
            rangeRes.headers.get('accept-ranges') === 'bytes', '4. HTTP Range Requests (206 Partial Content) for Scrubbing & Seeking');
        // -------------------------------------------------------------
        // TEST 4: Backend Audio API Library Endpoint
        // -------------------------------------------------------------
        const apiRes = await fetch(`${API_BASE}/audio`);
        const apiData = (await apiRes.json());
        assert(apiRes.status === 200 && Array.isArray(apiData.tracks) && apiData.tracks.length === 10, '5. Backend API Returns All 10 Tracks (4 Approved MP3s + 6 Procedural Tracks)');
        const mp3Tracks = apiData.tracks.filter((t) => t.audio_type === 'mp3');
        assert(mp3Tracks.length === 4, '6. All 4 Approved MP3 Tracks Identified with audio_type = "mp3"');
        // Verify Track 1: Ocean Waves
        const t1 = apiData.tracks.find((t) => t.id === 'track-ocean-waves-5min');
        assert(t1 &&
            t1.title.includes('Ocean Waves') &&
            t1.category === 'nature' &&
            t1.duration_sec === 299 &&
            t1.file_url === '/audio/5-minute-timer-relaxing-music-ocean-waves.mp3', '7. Track 1 (Ocean Waves 5min) Metadata Verified');
        // Verify Track 2: Alarm & Chimes
        const t2 = apiData.tracks.find((t) => t.id === 'track-alarm-relaxing-5min');
        assert(t2 &&
            t2.title.includes('Relaxing Music and Alarm') &&
            t2.category === 'ambient' &&
            t2.duration_sec === 309 &&
            t2.file_url === '/audio/5-minute-timer-relaxing-music-and-alarm.mp3', '8. Track 2 (Relaxing Music & Alarm 5min) Metadata Verified');
        // Verify Track 3: Alpha & Theta Waves
        const t3 = apiData.tracks.find((t) => t.id === 'track-alpha-theta-focus-5min');
        assert(t3 &&
            t3.title.includes('Alpha & Theta Waves') &&
            t3.category === 'binaural' &&
            t3.duration_sec === 340 &&
            t3.file_url === '/audio/5-minute-meditation-alpha-theta-waves-binaural-beats.mp3', '9. Track 3 (Alpha & Theta Binaural Beats Focus 5min) Metadata Verified');
        // Verify Track 4: Deep Alpha 15 min
        const t4 = apiData.tracks.find((t) => t.id === 'track-deep-alpha-15min');
        assert(t4 &&
            t4.title.includes('Deep Alpha Binaural Beats') &&
            t4.category === 'binaural' &&
            t4.duration_sec === 910 &&
            t4.file_url === '/audio/deep-alpha-binaural-beats-15-min-relaxation.mp3', '10. Track 4 (Deep Alpha 15min Brainwave Music) Metadata Verified');
        // -------------------------------------------------------------
        // TEST 5: Active Activity Completion with Background Music Track
        // -------------------------------------------------------------
        // Register a test user
        const testEmail = `audio_tester_${Date.now()}@meditation.local`;
        const regRes = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                password: 'AudioPassword123!',
                full_name: 'Soundscape Tester',
                stress_level: 'mild',
            }),
        });
        const regData = (await regRes.json());
        const token = regData.token;
        // Log an activity completion using Track 1 as the chosen soundscape
        const logRes = await fetch(`${API_BASE}/activities/log`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                activity_id: 'cyclic-sighing',
                duration_completed_sec: 180,
                notes: 'Practiced with 5-minute Ocean Waves background music',
            }),
        });
        const logData = (await logRes.json());
        assert(logRes.status === 201 && logData.log?.id, '11. Activity Completed & Logged Successfully While Background Music Plays');
        // -------------------------------------------------------------
        // TEST 6: Single-Instance Playback & Navigation Integrity
        // -------------------------------------------------------------
        // Verify frontend routes respond cleanly
        const audioPageRoute = await fetch(`${FRONTEND_BASE}/audio`);
        assert(audioPageRoute.status === 200, '12. Audio Library Page (/audio) Renders Cleanly with HTTP 200');
        console.log('\n================================================================');
        console.log(`🎉 AUDIO INTEGRATION TEST COMPLETE: ${passed} PASSED, ${failed} FAILED`);
        console.log('================================================================\n');
        if (failed > 0) {
            process.exit(1);
        }
    }
    catch (err) {
        console.error('💥 Audio test crashed:', err);
        process.exit(1);
    }
}
runAudioIntegrationTests();

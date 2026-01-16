# Adhan Audio Setup

## What was changed:

1. **Updated `static/script.js`**: Modified the `playNotificationSound()` function to play an adhan audio file (`/static/adhan.mp3`) instead of a simple beep sound.

2. **Updated `service-worker.js`**: Added the adhan audio file to the cache list and bumped the cache version to v3.

3. **Created placeholder**: A placeholder file `static/adhan.mp3` has been created. You need to replace it with an actual adhan recording.

## How to add your adhan audio:

1. Download or obtain an adhan recording in MP3 format
2. Replace the `static/adhan.mp3` file with your actual adhan audio file
3. Make sure the file is named exactly `adhan.mp3`

## Where to find adhan recordings:

- Islamic Network: https://aladhan.com/assets/audio/
- Various Islamic websites offer free adhan recordings
- You can use recordings from Mecca, Medina, or other locations

## Testing:

1. Enable notifications in the app settings
2. Enable notification sound
3. Click the "Test notification" button to hear the adhan
4. The app will fallback to a beep sound if the adhan file is not available or fails to load

## Note:

The notification sound plays when:
- Prayer time arrives
- Or when the advance notification time is triggered (if configured)

import os
import sys
import argparse
import json
import tempfile
import shutil
from instagrapi import image_util
from moviepy import VideoFileClip, AudioFileClip, concatenate_videoclips

def repair_video(input_path, output_path, thumbnail_path=None):
    try:
        # Check duration first
        clip = VideoFileClip(input_path)
        duration = clip.duration

        temp_input = None
        if duration < 3.0:
            # Loop video to be at least 3 seconds
            loops = int(3.0 / duration) + 1
            new_clip = concatenate_videoclips([clip] * loops)
            temp_input = tempfile.mktemp(suffix=".mp4")
            new_clip.write_videofile(temp_input, codec="libx264", audio_codec="aac", logger=None)
            input_path = temp_input
            clip = new_clip
            duration = clip.duration

        # instagrapi's prepare_video handles aspect ratio, size, and re-encoding
        try:
            video_content, size, duration, thumbnail_data = image_util.prepare_video(
                input_path,
                save_path=output_path,
                save_only=True,
                aspect_ratios=(4.0 / 5.0, 90.0 / 47.0),
                max_size=(1080, 1350)
            )
        except Exception as e:
            # Fallback manual prepare if instagrapi fails
            clip.write_videofile(output_path, codec="libx264", audio_codec="aac", logger=None)
            size = clip.size
            duration = clip.duration
            if thumbnail_path:
                clip.save_frame(thumbnail_path, t=0)
            thumbnail_data = None

        if thumbnail_path and thumbnail_data:
            with open(thumbnail_path, 'wb') as f:
                f.write(thumbnail_data)

        if temp_input and os.path.exists(temp_input):
            os.remove(temp_input)

        return {"status": "success", "size": size, "duration": duration}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def repair_image(input_path, output_path):
    try:
        image_data, size = image_util.prepare_image(
            input_path,
            save_path=output_path,
            max_size=(1080, 1350),
            aspect_ratios=None
        )
        return {"status": "success", "size": size}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def repair_audio(input_path, output_path):
    try:
        audio = AudioFileClip(input_path)
        audio.write_audiofile(output_path, codec='libmp3lame', logger=None)
        return {"status": "success", "duration": audio.duration}
    except Exception as e:
        return {"status": "error", "message": str(e)}

def compose_video_audio(video_path, audio_path, output_path):
    try:
        video = VideoFileClip(video_path)
        audio = AudioFileClip(audio_path)

        if audio.duration > video.duration:
            audio = audio.subclipped(0, video.duration)

        final_video = video.with_audio(audio)
        final_video.write_videofile(output_path, codec="libx264", audio_codec="aac", logger=None)

        return {"status": "success", "duration": final_video.duration}
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--type", required=True, choices=["video", "image", "audio", "compose"])
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    parser.add_argument("--audio", help="Audio file for composition")
    parser.add_argument("--thumbnail", help="Output path for thumbnail")

    args = parser.parse_args()

    result = {"status": "error", "message": "Unknown error"}

    if args.type == "video":
        result = repair_video(args.input, args.output, args.thumbnail)
    elif args.type == "image":
        result = repair_image(args.input, args.output)
    elif args.type == "audio":
        result = repair_audio(args.input, args.output)
    elif args.type == "compose":
        if not args.audio:
            result = {"status": "error", "message": "Audio file required for composition"}
        else:
            result = compose_video_audio(args.input, args.audio, args.output)

    sys.stdout.write(json.dumps(result))

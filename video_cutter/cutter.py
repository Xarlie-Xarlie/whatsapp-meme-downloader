import os
from moviepy.editor import VideoFileClip

videos_directory = "./videos/"
segment_duration = 30  # seconds

# List all files in the videos directory
for filename in os.listdir(videos_directory):
    filepath = os.path.join(videos_directory, filename)

    # Check if it's a video file (you can adjust the extensions as needed)
    if os.path.isfile(filepath) and filename.lower().endswith(".mp4"):
        clip = VideoFileClip(filepath)

        # Check if the duration is greater than 30 seconds
        if clip.duration > segment_duration:
            base_filename = os.path.splitext(filename)[0]  # Get the base filename
            for i, start_time in enumerate(range(0, int(clip.duration), segment_duration)):
                end_time = min(start_time + segment_duration, clip.duration)
                segment = clip.subclip(start_time, end_time)

                # Specify a custom filename for each segment
                segment_filename = f"./videos/{base_filename}_part_{i}.mp4"
                segment.write_videofile(segment_filename, codec="libx264")

                print(f"Segment {i} of {base_filename}: Saved as {segment_filename}")

            # Close the original video clip
            clip.close()

            # Remove the original video file
            os.remove(filepath)
            print(f"Original video {filename} removed after segmentation.")

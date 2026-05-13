import cv2
import sys

def get_resolution(video_path):
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print(f"Error opening video {video_path}")
        return
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"WIDTH:{width} HEIGHT:{height}")
    cap.release()

if __name__ == "__main__":
    get_resolution(sys.argv[1])

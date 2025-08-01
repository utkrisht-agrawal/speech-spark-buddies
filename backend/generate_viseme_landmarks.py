import os
import json
import cv2
import mediapipe as mp

PUBLIC_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public')
MOUTH_SHAPES_DIR = os.path.join(PUBLIC_DIR, 'mouth_shapes')
UPLOADS_DIR = os.path.join(PUBLIC_DIR, 'lovable-uploads')

OUTPUT_FILE = os.path.join(PUBLIC_DIR, 'viseme_landmarks.json')

# gather all mouth shape image paths
image_paths = []
for root_dir in [MOUTH_SHAPES_DIR, UPLOADS_DIR]:
    if not os.path.isdir(root_dir):
        continue
    for fname in os.listdir(root_dir):
        if fname.lower().endswith(('.png', '.jpg', '.jpeg')) and (
            'mouth' in fname or 'phoneme' in fname
        ):
            image_paths.append(os.path.join(root_dir, fname))

mp_face_mesh = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True)

lip_indices = sorted({idx for pair in mp.solutions.face_mesh.FACEMESH_LIPS for idx in pair})

landmarks_data = {}

for path in image_paths:
    image = cv2.imread(path)
    if image is None:
        print('Failed to load', path)
        continue
    rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = mp_face_mesh.process(rgb_image)
    if not results.multi_face_landmarks:
        print('No face found in', path)
        continue
    lm = results.multi_face_landmarks[0].landmark
    min_x = min(lm[i].x for i in lip_indices)
    max_x = max(lm[i].x for i in lip_indices)
    min_y = min(lm[i].y for i in lip_indices)
    max_y = max(lm[i].y for i in lip_indices)
    coords = [
        [
            (lm[i].x - min_x) / (max_x - min_x + 1e-6),
            (lm[i].y - min_y) / (max_y - min_y + 1e-6)
        ]
        for i in lip_indices
    ]
    rel_path = os.path.relpath(path, PUBLIC_DIR).replace('\\', '/')
    landmarks_data[rel_path] = coords

mp_face_mesh.close()

with open(OUTPUT_FILE, 'w') as f:
    json.dump({'indices': lip_indices, 'landmarks': landmarks_data}, f, indent=2)

print('Saved landmarks to', OUTPUT_FILE)

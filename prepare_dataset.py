
import random
import shutil
from pathlib import Path

SOURCE = Path(
    r"C:\Users\pooji\OneDrive - Alliance University\DermaLytix\archive (1)"
)

OUTPUT = Path("dataset")

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

random.seed(42)

train_source = SOURCE / "train"
test_source = SOURCE / "test"

train_classes = {p.name for p in train_source.iterdir() if p.is_dir()}
test_classes = {p.name for p in test_source.iterdir() if p.is_dir()}

common_classes = sorted(train_classes & test_classes)

print("Matching categories:", len(common_classes))
print("Categories skipped:", sorted(test_classes - train_classes))

for folder in ["train", "validation", "test"]:
    (OUTPUT / folder).mkdir(parents=True, exist_ok=True)

for category in common_classes:
    images = [
        p for p in (train_source / category).iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
    ]

    random.shuffle(images)

    split_index = int(len(images) * 0.8)
    train_images = images[:split_index]
    validation_images = images[split_index:]

    for folder, selected_images in [
        ("train", train_images),
        ("validation", validation_images),
    ]:
        destination = OUTPUT / folder / category
        destination.mkdir(parents=True, exist_ok=True)

        for image in selected_images:
            shutil.copy2(image, destination / image.name)

    test_images = [
        p for p in (test_source / category).iterdir()
        if p.is_file() and p.suffix.lower() in IMAGE_EXTENSIONS
    ]

    destination = OUTPUT / "test" / category
    destination.mkdir(parents=True, exist_ok=True)

    for image in test_images:
        shutil.copy2(image, destination / image.name)

print("\nDataset preparation completed!")

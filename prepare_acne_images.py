
from datasets import load_from_disk
from sklearn.model_selection import train_test_split
from pathlib import Path

# Load dataset from D: drive
dataset = load_from_disk(r"D:\DermaLytix_Data\ACNE04")
data = dataset["train"]

# Read labels and original split without decoding images
splits = data["split"]
severities = data["severity"]

original_train = [
    i for i, value in enumerate(splits) if value == "train"
]
original_test = [
    i for i, value in enumerate(splits) if value == "test"
]

# Create validation set from training images only
train_indices, val_indices = train_test_split(
    original_train,
    test_size=0.20,
    random_state=42,
    stratify=[severities[i] for i in original_train]
)

output = Path(r"D:\DermaLytix_Data\ACNE04_images")

# Export images one at a time to reduce RAM usage
for split_name, indices in [
    ("train", train_indices),
    ("validation", val_indices),
    ("test", original_test)
]:
    for index in indices:
        row = data[index]
        severity = row["severity"]

        folder = output / split_name / severity
        folder.mkdir(parents=True, exist_ok=True)

        image = row["image"]
        filename = f"{index}_{row['file_name']}"

        image.convert("RGB").save(folder / filename)

    print(f"{split_name}: {len(indices)} images saved")

print("ACNE04 image preparation completed!")
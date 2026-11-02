import json
from pathlib import Path
import tensorflow as tf

from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras import layers, models
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint

DATA_DIR = Path(r"D:\DermaLytix_Data\ACNE04_images")
OUTPUT_DIR = Path(r"D:\DermaLytix_Data\acne_model")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

IMAGE_SIZE = (224, 224)
BATCH_SIZE = 16

train_gen = ImageDataGenerator(
    preprocessing_function=preprocess_input
)

val_test_gen = ImageDataGenerator(
    preprocessing_function=preprocess_input
)

train_data = train_gen.flow_from_directory(
    str(DATA_DIR / "train"),
    target_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    shuffle=True
)

val_data = val_test_gen.flow_from_directory(
    str(DATA_DIR / "validation"),
    target_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    shuffle=False
)

test_data = val_test_gen.flow_from_directory(
    str(DATA_DIR / "test"),
    target_size=IMAGE_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    shuffle=False
)

base_model = MobileNetV2(
    weights="imagenet",
    include_top=False,
    input_shape=(224, 224, 3)
)

base_model.trainable = False

model = models.Sequential([
    base_model,
    layers.GlobalAveragePooling2D(),
    layers.Dense(128, activation="relu"),
    layers.Dropout(0.3),
    layers.Dense(4, activation="softmax")
])

model.compile(
    optimizer="adam",
    loss="categorical_crossentropy",
    metrics=["accuracy"]
)

callbacks = [
    EarlyStopping(
        monitor="val_loss",
        patience=3,
        restore_best_weights=True
    ),
    ModelCheckpoint(
        str(OUTPUT_DIR / "best_acne_model.keras"),
        monitor="val_accuracy",
        save_best_only=True
    )
]

with open(OUTPUT_DIR / "class_names.json", "w") as f:
    json.dump(train_data.class_indices, f, indent=4)

history = model.fit(
    train_data,
    validation_data=val_data,
    epochs=10,
    callbacks=callbacks
)

model = tf.keras.models.load_model(
    OUTPUT_DIR / "best_acne_model.keras"
)

test_loss, test_accuracy = model.evaluate(test_data)

print(f"Test accuracy: {test_accuracy * 100:.2f}%")

model.save(OUTPUT_DIR / "acne_severity_model.keras")

print("Acne severity model training completed!")
import os
import argparse
import random
import json

import numpy as np
from PIL import Image
from tensorflow import keras

import conf
import models

def generator(samples, batch_size = 32):
    num_samples = len(samples)
    
    while 1: 
        for offset in range(0, num_samples, batch_size):
            batch_samples = samples[offset:offset+batch_size]
            images = []
            controls = []
            for fullpath in batch_samples:
                try:
                    frame_number = os.path.basename(fullpath).split("_")[0]
                    json_filename = os.path.join(os.path.dirname(fullpath), "record_" + frame_number + ".json")
                    with open(json_filename, "rt") as fp:
                        data = json.load(fp)
                    steering = float(data["user/angle"])
                    throttle = float(data["user/throttle"])
                    try:
                        image = Image.open(fullpath)
                    except:
                        continue
                    image = np.array(image)
                    images.append(image)
                    center_angle = steering
                    controls.append([center_angle, throttle])
                except:
                    yield [], []

            X_train = np.array(images)
            y_train_angle = np.array([i[0] for i in controls])
            y_train_throttle = np.array([i[1] for i in controls])
            yield X_train, [y_train_angle, y_train_throttle]

def train_test_split(lines, test_perc):
    train = []
    test = []
    for line in lines:
        if random.uniform(0.0, 1.0) < test_perc:
            test.append(line)
        else:
            train.append(line)

    return train, test

def make_generators(inputs, batch_size = 32):
    lines = [os.path.join(inputs, f) for f in os.listdir(inputs) if "jpg" in f]
    train_samples, validation_samples = train_test_split(lines, test_perc = 0.2)
    train_generator = generator(train_samples, batch_size = batch_size)
    validation_generator = generator(validation_samples, batch_size = batch_size)
    
    n_train = len(train_samples)
    n_val = len(validation_samples)
    
    return train_generator, validation_generator, n_train, n_val

def run(model_name, inputs = 'tub'):
    batch_size = conf.training_batch_size
    train_generator, validation_generator, n_train, n_val = make_generators(inputs, batch_size = batch_size)
    if n_train == 0:
        return

    steps_per_epoch = n_train // batch_size
    validation_steps = n_val // batch_size

    model = models.wonder_wander_model(conf.num_outputs)
    callbacks = [
        keras.callbacks.EarlyStopping(monitor = 'val_loss', patience = conf.training_patience, verbose = 0),
        keras.callbacks.ModelCheckpoint(model_name, monitor = 'val_loss', save_best_only = True, verbose = 0),
    ]
    model.fit_generator(train_generator, 
        steps_per_epoch = steps_per_epoch,
        validation_data = validation_generator,
        validation_steps = validation_steps,
        epochs = conf.training_epochs,
        verbose = 1,
        callbacks = callbacks)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description = 'simple train')
    parser.add_argument('--model', type = str, help = 'model name')
    parser.add_argument('--inputs', default = './tub/', help = 'input directory')
    args = parser.parse_args()
    
    run(model_name = args.model, inputs = args.inputs)
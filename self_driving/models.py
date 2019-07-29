from tensorflow.python.keras.models import Model
from tensorflow.python.keras.layers import Conv2D, Input, Dense, Lambda, Dropout, Flatten, Cropping2D

import conf

def wonder_wander_model(num_outputs):

    image_height, image_width, image_depth = conf.image_height, conf.image_width, conf.image_depth
    
    drop = 0.2
    
    img_in = Input(shape=(image_height, image_width, image_depth), name='img_in')
    x = img_in
    x = Cropping2D(cropping=((10,0), (0,0)))(x)
    x = Lambda(lambda x: x/255.0 )(x)
    x = Conv2D(24, (5,5), strides=(2,2), activation='relu')(x)
    x = Dropout(drop)(x)
    x = Conv2D(32, (5,5), strides=(2,2), activation='relu')(x)
    x = Dropout(drop)(x)
    x = Conv2D(64, (5,5), strides=(2,2), activation='relu')(x)
    x = Dropout(drop)(x)
    x = Conv2D(64, (3,3), strides=(1,1), activation='relu')(x)
    x = Dropout(drop)(x)
    x = Conv2D(64, (3,3), strides=(1,1), activation='relu')(x)
    x = Dropout(drop)(x)
    
    x = Flatten(name='flattened')(x)
    x = Dense(100, activation='relu')(x)
    x = Dropout(drop)(x)
    x = Dense(50, activation='relu')(x)
    x = Dropout(drop)(x)

    angle_out = Dense(1, name='angle_out')(x)
    throttle_out = Dense(1, name='throttle_out')(x)

    model = Model(inputs=[img_in], outputs=[angle_out, throttle_out])
    model.compile(optimizer='adam',
                  loss={'angle_out': 'mse',
                        'throttle_out': 'mse'},
                  loss_weights={'angle_out': 0.9, 'throttle_out': .01})
    return model

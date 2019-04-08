import React, { PureComponent } from 'react';
import { StyleSheet, View, Image } from "react-native";
import { WIDTH, HEIGHT, RADIUS, VALIDCOLORS } from './constants';

const PILLwIDTH = RADIUS * 5;
const PILLHEIGHT = RADIUS * 2;

const BEAKERWIDTH = WIDTH / 3;
const BEAKERHEIGHT = BEAKERWIDTH * 1.105;
const REALBEAKERWIDTH = (BEAKERWIDTH * 0.9)
const LEFTCOLLIDERWIDTH = 10;
const LEFTCOLLIDERHEIGHT = BEAKERHEIGHT;
const RIGHTCOLLIDERWITH = (BEAKERWIDTH - REALBEAKERWIDTH) * 2;
const BOTTOMCOLLIDERWIDTH = REALBEAKERWIDTH;
const BOTTOMCOLLIDERHEIGHT = LEFTCOLLIDERWIDTH;

//#region Matter-objects:
const colliderSettings = { isStatic: true, friction: 0.2, restitution: 1, label: 'collider' };
const colliderLeft = Matter.Bodies.rectangle(
    WIDTH - BEAKERWIDTH - styles.beaker.right + (LEFTCOLLIDERWIDTH * 4), (HEIGHT - BEAKERHEIGHT - styles.beaker.bottom) + LEFTCOLLIDERHEIGHT / 2, LEFTCOLLIDERWIDTH, LEFTCOLLIDERHEIGHT,
    { ...colliderSettings }
);
const colliderRight = Matter.Bodies.rectangle(
    WIDTH - styles.beaker.right - (BEAKERWIDTH - REALBEAKERWIDTH) + (RIGHTCOLLIDERWITH / 2), (HEIGHT - BEAKERHEIGHT - styles.beaker.bottom) + LEFTCOLLIDERHEIGHT / 2, RIGHTCOLLIDERWITH, LEFTCOLLIDERHEIGHT,
    { ...colliderSettings }
);
const colliderBottom = Matter.Bodies.rectangle(
    WIDTH - BEAKERWIDTH - styles.beaker.right + (BOTTOMCOLLIDERWIDTH / 2), HEIGHT - styles.beaker.bottom, BOTTOMCOLLIDERWIDTH, BOTTOMCOLLIDERHEIGHT,
    { ...colliderSettings, restitution: 0, label: 'beaker' }
);
const ground = Matter.Bodies.rectangle(
    WIDTH / 2, HEIGHT - styles.beaker.bottom + 15 + HEIGHT, WIDTH * 50, HEIGHT * 2,
    { isStatic: true, label: 'ground' }
);

export const colliders = [colliderLeft, colliderRight, colliderBottom, ground];

//#endregion

//#region React-components:
const images = {
    persson: {
        head: require('../assets/images/phead.png'),
        body: require('../assets/images/pbody.png'),
        brow: require('../assets/images/eyebrow.png'),
    },
    beaker: require('../assets/images/beaker.png')
};


const perssonRatio = (WIDTH / 4) / 406;

const styles = StyleSheet.create({
    persson: {
        position: 'absolute',
        left: WIDTH / 2 - (406 * perssonRatio) / 2,
        bottom: 50,
        width: 406 * perssonRatio,
        height: 587 * perssonRatio
    },
    perssonHead: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: 406 * perssonRatio,
        height: 395 * perssonRatio,
    },
    personBody: {
        position: 'absolute',
        top: 300 * perssonRatio,
        left: 35 * perssonRatio,
        width: 356 * perssonRatio,
        height: 265 * perssonRatio,
    },
    personEyebrow: {
        position: 'absolute',
        top: 160 * perssonRatio,
        left: 225 * perssonRatio,
        width: 103 * perssonRatio,
        height: 20 * perssonRatio
    },
    beaker: {
        height: BEAKERHEIGHT,
        width: BEAKERWIDTH,
        position: 'absolute',
        bottom: 20,
        right: 20
    },
    pill: {
        borderRadius: RADIUS * 2,
        width: PILLwIDTH,
        height: PILLHEIGHT,
        backgroundColor: "transparent",
        position: 'absolute',
    },
    side: {
        position: "absolute",
        top: 0,
        width: RADIUS * 2.5,
        height: RADIUS * 2,
    },
    left: {
        left: 0,
        borderTopLeftRadius: RADIUS,
        borderBottomLeftRadius: RADIUS,
    },
    right: {
        right: 0,
        borderTopRightRadius: RADIUS,
        borderBottomRightRadius: RADIUS,
    },
});

const randomColor = () => VALIDCOLORS[Math.floor(Math.random() * VALIDCOLORS.length)];
const randomX = () => Math.floor(Math.random() * (WIDTH - (WIDTH / 2) - 100));

export const makePill = (density = 0.001) => {
    return Matter.Bodies.rectangle(
        randomX(),
        0,
        PILLwIDTH,
        PILLHEIGHT,
        {
            inertia: 0,
            friction: 0.6,
            restitution: 1,
            chamfer: { radius: RADIUS },
            label: 'pill',
            density: density,
        }
    );
};

export const randomColors = (count = 2) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
        let col = randomColor();
        while (count < VALIDCOLORS.length && colors.includes(col)) {
            col = randomColor();
        }
        colors.push(col);
    }
    return colors;
};

export class Pill extends PureComponent {
    render() {
        const { body, colors } = this.props;
        return !(body && colors) ? null : (
            <View style={[styles.pill, { top: body.position.y - PILLHEIGHT, left: body.position.x - PILLwIDTH }]}>
                <View style={[styles.side, styles.left, { backgroundColor: colors.left }]} />
                <View style={[styles.side, styles.right, { backgroundColor: colors.right }]} />
            </View>
        );
    }
}

export class Beaker extends PureComponent {
    render() {
        return (
            <Image
                style={[styles.beaker]}
                source={images.beaker} />
        );
    }
}

export class Persson extends PureComponent {
    render() {
        const { offset, eyebrow } = this.props;
        return (
            <View style={[styles.persson]}>
                <Image style={[styles.personBody]} source={images.persson.body} />
                <Image style={[styles.perssonHead, offset]} source={images.persson.head} />
                <Image style={[styles.personEyebrow, eyebrow]} source={images.persson.brow} />
            </View>
        )
    }
}

export class Ground extends PureComponent {
    render() {
        return (
            <View style={{ position: 'absolute', left: 0, bottom: 0, width: WIDTH, height: styles.beaker.bottom - 5, backgroundColor: '#fff' }} />
        )
    }
}
//#endregion

import React, { PureComponent } from 'react';
import { StyleSheet, Dimensions, Text, View, TouchableHighlight, Image } from "react-native";
import { Font, Audio } from 'expo';

// import * as Animatable from 'react-native-animatable';

import Matter from "matter-js";
import { GameLoop } from "react-native-game-engine";

const { width: WIDTH, height: HEIGHT } = Dimensions.get("window");
const RADIUS = 12;
const MAXSCORE = 30;
const WINNINGSCORE = MAXSCORE / 2;
const VALIDCOLORS = ['#fff', '#000', '#f00'];

const INITIALGRAVITY = 0.09;
const DELTASPEED = 1.1;

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

const perssonRatio = (WIDTH / 4) / 406;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ff0',
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  absolute: {
    position: 'absolute',
  },
  beaker: {
    height: BEAKERHEIGHT,
    width: BEAKERWIDTH,
    position: 'absolute',
    bottom: 20,
    right: 20
  },
  text: {
    color: '#000',
    position: 'absolute',
    zIndex: 999
  },
  gameover: {
    left: 0,
    width: WIDTH,
    top: HEIGHT / 3,
    position: 'absolute'
  },
  header: {
    top: 50,
    left: 10,
    fontSize: 24,
    fontFamily: 'space-grotesk-regular',
  },
  footer: {
    bottom: 15,
    right: 15,
    fontSize: 32,
    fontFamily: 'space-grotesk-bold'
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


const colliderSettings = { isStatic: true, friction: 0.2 };

const colliderLeft = Matter.Bodies.rectangle(
  WIDTH - BEAKERWIDTH - styles.beaker.right + (LEFTCOLLIDERWIDTH * 4), (HEIGHT - BEAKERHEIGHT - styles.beaker.bottom) + LEFTCOLLIDERHEIGHT / 2, LEFTCOLLIDERWIDTH, LEFTCOLLIDERHEIGHT,
  {... colliderSettings, restitution: 1, label: 'collider' }
);
const colliderRight = Matter.Bodies.rectangle(
  WIDTH - styles.beaker.right - (BEAKERWIDTH - REALBEAKERWIDTH) + (RIGHTCOLLIDERWITH / 2), (HEIGHT - BEAKERHEIGHT - styles.beaker.bottom) + LEFTCOLLIDERHEIGHT / 2, RIGHTCOLLIDERWITH, LEFTCOLLIDERHEIGHT,
  {... colliderSettings, restitution: 1, label: 'collider' }
);
const colliderBottom = Matter.Bodies.rectangle(
  WIDTH - BEAKERWIDTH - styles.beaker.right + (BOTTOMCOLLIDERWIDTH / 2), HEIGHT - styles.beaker.bottom, BOTTOMCOLLIDERWIDTH, BOTTOMCOLLIDERHEIGHT,
  {... colliderSettings, restitution: 0, label: 'beaker' }
);

const randomColor = () => VALIDCOLORS[Math.floor(Math.random() * VALIDCOLORS.length)];
const randomX = () => Math.floor(Math.random() * (WIDTH - (WIDTH / 4) - 100));


const makePill = (density = 0.001) => {
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

const numToText = (n) => {
  const uptonineteen = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
  ],
    aftertwentyparts = [
      '', '-one', '-two', '-three', '-four', '-five', '-six', '-seven', '-eight', '-nine'
    ],
    tens = ['twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'],
    translate = [
      ...uptonineteen
    ];

  tens.forEach(t => aftertwentyparts.forEach(a => translate.push(`${t}${a}`)));
  if (n < translate.length) {
    return translate[n];
  }
  return 'infinite';
};


const ground = Matter.Bodies.rectangle(WIDTH / 2, HEIGHT - styles.beaker.bottom + 15 + HEIGHT, WIDTH * 50, HEIGHT * 2, { isStatic: true, label: 'ground' });

const engine = Matter.Engine.create(),
  world = engine.world,
  runner = Matter.Runner.create();

engine.world.gravity = { x: 0, y: 0 };

class Pill extends PureComponent {
  render() {
    const { body, colors } = this.props;
    return !(body && colors) ? null : (
      <View style={[styles.pill, {top: body.position.y - PILLHEIGHT, left: body.position.x - PILLwIDTH}]}>
        <View style={[styles.side, styles.left, { backgroundColor: colors.left }]} />
        <View style={[styles.side, styles.right, { backgroundColor: colors.right }]} />
      </View>
    );
  }
}

class Beaker extends PureComponent {
  render() {
    return (
      <Image
        style={[styles.beaker]}
        source={require('./assets/beaker.png')} />
    );
  }
}

class Persson extends PureComponent {
  render() {
    const {offset} = this.props; 
    return (
      <View style={[styles.persson]}>
        <Image  style={[styles.personBody]} source={require('./assets/pbody.png')}/>
        <Image style={[styles.perssonHead, offset]} source={require('./assets/phead.png')}/>
      </View>
    )
  }
}

const GAMESTATES = {
  init: 0,
  started: 1,
  won: 2,
  lost: 3
};

export default class App extends PureComponent {
  state = {
    score: 0,
    gameState: GAMESTATES.init,
    fontsLoaded: false,
    pillsLeft: MAXSCORE,
    pills: [],
    personOffset: {}
  };

  constructor(props) {
    super(props);

    this.updateHandler = ({ touches, screen, time }) => {
      if (this.state.gameState !== GAMESTATES.started) {
        return;
      }
      let deltaX = 0;

      const move = touches.find(x => x.type === "move"),
        active = world.bodies.filter(b => b.label === 'pill');

      if (move) {
        deltaX = move.delta.pageX;
      }
      active.forEach((b) => {
        if (!b.isStatic && !b.isSleeping) {
          if (b.position.y > HEIGHT) {
            this.removePill(b);
          } else {
            Matter.Body.setVelocity(
              b, {
                x: deltaX,
                y: b.velocity.y
              }
            );
          }
        }
      });

      Matter.Engine.update(engine, time.delta);
    };
  };

  removePill = (body) => {
    this.setState({ pills: this.state.pills.filter(p => p.body.id !== body.id) });  
    Matter.World.remove(world, body);
  }

  init = () => {  
    world.gravity.y = INITIALGRAVITY;

    this.setState({
      gameState: GAMESTATES.started,
      pills: [],
      pillsLeft: MAXSCORE,
      score: 0
    });
    setTimeout(this.updatePills, 250);
  };

  start = () => {
    Matter.World.addBody(world, ground);
    Matter.World.addBody(world, colliderBottom);
    Matter.World.addBody(world, colliderLeft);
    Matter.World.addBody(world, colliderRight);

    Matter.Runner.run(runner, engine);

    this.init();
  };

  victoryAnimation = () => {
    [
      2, 2, -5, 5, -5, 2, -2, 5,
      2, 2, -4, 5, -3, 2, -2, 2,
      2, 2, -3, 5, -3, 2, -1, 0,
    ].forEach((v, i) => {
      setTimeout(() => this.setState({personOffset: {top: styles.perssonHead.top + v}}), 70 * i);
    });
  };

  updatePills = (remove = null, isPoint = false) => {
    if (remove) {
      this.removePill(remove);
      world.gravity.y *= DELTASPEED;
    }
    if (this.state.pillsLeft > 0) {
      const newPill = makePill();
      let leftColor = randomColor(),
        rightColor = randomColor();
      while (rightColor === leftColor) {
        rightColor = randomColor();
      }

      Matter.Body.setVelocity(newPill, { x: 0, y: world.gravity.y / INITIALGRAVITY});
      Matter.World.addBody(world, newPill);
      Matter.Engine.update(engine);

      this.setState({
        pills: [...this.state.pills, { body: newPill, colors: { left: leftColor, right: rightColor } }],
        pillsLeft: this.state.pillsLeft - 1
      });
    } else {
      const newState = this.state.score >= WINNINGSCORE ? GAMESTATES.won : GAMESTATES.lost;
      this.setState({
        gameState: newState
      });
      if (newState === GAMESTATES.won) {
        setTimeout(this.victoryAnimation, 500);
      }
    }
  }

  componentWillMount() {
    // console.log(engine);
    Matter.Events.on(engine, 'collisionStart', (event) => {
      const pairs = event.pairs;
      if (pairs.length > 0) {
        const {bodyA, bodyB} = pairs[0];
        const objA = bodyA.label,
          objB = bodyB.label;

        if (objB === 'pill' && objA === 'beaker') {
          this.setState({ score: this.state.score + 1 });
          this.updatePills(bodyB, true);
        } else if (objB === 'pill' && objA === 'collider') {
          // let deltaX = Math.random() * 100;
          // if (bodyA.id === colliderLeft.id) {
          //   deltaX = -deltaX;
          // }
          // Matter.Body.setVelocity(bodyB, { x: bodyB.velocity.x + deltaX, y: bodyB.velocity.y });
        } else if (objB === 'pill' && objA === 'ground') {
          this.updatePills(bodyB);
        }
      }
    });
    Matter.Events.on(engine, 'beforeUpdate', (ev) => {
      this.setState({
        pills: this.state.pills.map((p) => {
          return {
            ...p,
            body: {...world.bodies.find(b => b.id === p.body.id)}
          }
        })
      });
    });
  }

  mainTheme = null;

  loadMainTheme = async () => {
    if (!this.mainTheme) {
      try {
        this.mainTheme = new Audio.Sound();
        await this.mainTheme.loadAsync(require('./assets/main.mp3'));
        await this.mainTheme.setIsLoopingAsync(true);
      } catch (e) {
        console.log(e);
      } 
    }
  };

  playMainTheme = async () => {
    try {
      await this.loadMainTheme();
      await this.mainTheme.playAsync({ shouldPlay: true });
      // Your sound is playing!
    } catch (error) {
      // An error occurred!
    }
  };

  async componentDidMount() {
    await Font.loadAsync({
      'space-grotesk-bold': require('./assets/fonts/SpaceGrotesk-Bold.ttf'),
      'space-grotesk-regular': require('./assets/fonts/SpaceGrotesk-Regular.ttf')
    });
    await this.playMainTheme();
    this.setState({ fontsLoaded: true });
  }

  startscreen = () => {
    return !this.state.fontsLoaded ? <Text>Loading...</Text> : (
        <View style={[styles.text, { top: HEIGHT / 3 }]}>
          <Text style={{ textAlign: 'center', fontSize: 48, fontFamily: 'space-grotesk-bold' }}>
            dr. persson
          </Text>
          <TouchableHighlight onPress={this.start}>
            <View style={{ backgroundColor: '#fff', padding: 15, paddingBottom: 20, margin: 15 }}>
              <Text style={{ textAlign: 'center', fontSize: 32, fontFamily: 'space-grotesk-regular' }}>
                start game
                </Text>
            </View>
          </TouchableHighlight>
        </View>
    );
  };

  scoreboard = () => {
    const scoreText = numToText(this.state.score),
      pillsText = numToText(this.state.pillsLeft + 1);

    return !this.state.fontsLoaded ? null : (
      <View style={[styles.text, styles.header]}>
        <Text>score:</Text>
        <Text style={{ fontFamily: 'space-grotesk-bold', marginTop: -5 }}>{scoreText}</Text>
        <Text>pills left:</Text>
        <Text style={{ fontFamily: 'space-grotesk-bold', marginTop: -5 }}>{pillsText}</Text>
      </View>
    );
  };

  gameover = () => {
    return !this.state.fontsLoaded ? null : (
      <View style={[styles.text, styles.gameover]}>
        <Text style={{ textAlign: 'center', fontSize: 48, fontFamily: 'space-grotesk-bold' }}>
          Score: {this.state.score}
        </Text>
        <TouchableHighlight onPress={this.init}>
          <View style={{ backgroundColor: '#fff', padding: 15, paddingBottom: 20, margin: 15 }}>
            <Text style={{ textAlign: 'center', fontSize: 32, fontFamily: 'space-grotesk-regular' }}>
              {this.state.score < MAXSCORE / 4 ? 'try again' : 'play again'}
            </Text>
          </View>
        </TouchableHighlight>
      </View>
    );
  };

  styleForBody = (body) => {
    var obj = world.bodies.find(b => b.id === body.id);
    if (obj && obj.position) {
      return {
        position: 'absolute',
        top: obj.position.y * HEIGHT,
        left: obj.position.x,
        width: obj.width,
        height: obj.height
      };
    }
    return {};
  }

  bodyToView = (body) => {
    return {position: 'absolute', backgroundColor: '#f00'};
  }

  render() {
    const state = this.state.gameState;
    return (
      <GameLoop style={styles.container} onUpdate={this.updateHandler}>
        {state !== GAMESTATES.won ? null : 
          <Persson offset={this.state.personOffset} />
        }
        {state !== GAMESTATES.init ? null : this.startscreen()}
        {state !== GAMESTATES.won && state !== GAMESTATES.lost ? null : this.gameover()}
        {state !== GAMESTATES.started ? null : this.scoreboard()}
        {this.state.pills.map((p, i) => {
          return (<Pill key={'pill-' + i} style={{transform: [{rotate: p.body.angle + 'rad'}]}} body={p.body} colors={p.colors} />);
        })}

        {state !== GAMESTATES.started ? null : 
          <Beaker />
        }
        {state !== GAMESTATES.started ? null : 
          <View style={{position: 'absolute', left: 0, bottom: 0, width: WIDTH, height: styles.beaker.bottom - 5, backgroundColor: '#fff'}}/>
        }
      </GameLoop>
    );
  }
}
// WIDTH / 2, HEIGHT - 5, WIDTH * 3, 10
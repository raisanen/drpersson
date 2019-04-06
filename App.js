import React, { PureComponent } from 'react';
import { StyleSheet, Dimensions, Text, View, TouchableHighlight, Image } from "react-native";
import { Font } from 'expo';

import { GameLoop } from "react-native-game-engine";

const { width: WIDTH, height: HEIGHT } = Dimensions.get("window");
const RADIUS = 12;
const MAXSCORE = 10;
const VICTORYSCORE = MAXSCORE / 2;
const VALIDCOLORS = ['#fff', '#000', '#f00', '#0f0', '#0ff', '#00f'];
const STARTSPEED = 0.35;
const SPEEDDELTA = 1.22;

const randomColor = () => VALIDCOLORS[Math.floor(Math.random() * VALIDCOLORS.length)];
const randomX = () => Math.floor(Math.random() * (WIDTH - 100));


class Pill extends PureComponent {
  render() {
    const x = this.props.position[0] - RADIUS / 2,
      y = this.props.position[1] - RADIUS / 2,
      leftColor = this.props.colors[0],
      rightColor = this.props.colors[1];
    return (
      <View style={[styles.pill, { left: x, top: y }]}>
        <View style={[styles.side, styles.left, { backgroundColor: leftColor }]} />
        <View style={[styles.side, styles.right, { backgroundColor: rightColor }]} />
      </View>
    );
  }
}

export default class App extends React.Component {
  state = {
    itsStillGood: true,
    hasWon: false,
    fontsLoaded: false,
    preInit: true,
    score: 0,
    speed: 0,
    pills: [],
    victoryAnim: {
      y: 0,
      scale: 0,
      opacity: 0,
      delay: 10
    }
  };

  init = () => {
    const pills = [];
    for (let i = 0; i < MAXSCORE; i++) {
      let leftColor = randomColor(),
        rightColor = randomColor();

      while (leftColor === rightColor) {
        rightColor = randomColor();
      }

      pills.push({
        pos: { x: randomX(), y: -40 },
        colors: [leftColor, rightColor],
        state: 0
      });
    }
    // Math.floor(Math.random()*items.length)
    this.setState({
      pills: [...pills],
      score: 0,
      speed: STARTSPEED,
      itsStillGood: true,
      preInit: false,
      victoryAnim: {
        y: HEIGHT,
        scale: 1.0,
        opacity: 1.0,
        delay: 10
      }
    });
  }

  runVictoryAnimation = () => {
    if (this.state.victoryAnim.delay > 0) {
      this.setState({
        victoryAnim: { ...this.state.victoryAnim, delay: this.state.victoryAnim.delay - 1 }
      })
    } else {
      this.setState({
        victoryAnim: {
          y: this.state.victoryAnim.y - 5,
          scale: this.state.victoryAnim.scale - 0.005
        }
      });  
    }
  };

  async componentDidMount() {
    console.log('Loading...');
    await Font.loadAsync({
      'space-grotesk-bold': require('./assets/fonts/SpaceGrotesk-Bold.ttf'),
      'space-grotesk-regular': require('./assets/fonts/SpaceGrotesk-Regular.ttf')
    });
    console.log('Loaded...');
    this.setState({ fontsLoaded: true });
  }

  numToText = (n) => {
    const translate = [
      'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
      'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'
    ];
    if (n < translate.length) {
      return translate[n];
    }
    return 'infinite';
  };

  numPillsLeft = () => this.state.pills.filter(p => p.state === 0).length;

  scoreString = () => {
    const score = this.state.score;
    if (score === 0) {
      return 'game over';
    }
    const start = score < (MAXSCORE / 2) ? 'well done' : (score === MAXSCORE ? 'perfect' : 'awesome'),
      points = `point${score === 1 ? '' : 's'}`;

    return `${start}! you got ${score} ${points}`;
  };

  updateHandler = ({ touches, screen, time }) => {
    if (this.state.preInit) {
      return;
    }

    const move = touches.find(x => x.type === "move"),
      deltaX = move ? move.delta.pageX : 0,
      deltaY = time.delta * this.state.speed,
      beakerBottomRight = {
        x: WIDTH - styles.beaker.right,
        y: HEIGHT - styles.beaker.bottom,
      },
      beakerTopRight = {
        x: beakerBottomRight.x,
        y: beakerBottomRight.y - styles.beaker.height,
      },
      beakerTopLeft = {
        x: beakerTopRight.x - styles.beaker.width,
        y: beakerTopRight.y
      },
      beakerBottomLeft = {
        x: beakerTopLeft.x,
        y: beakerBottomRight.y
      };

    const validPills = this.state.pills
      .map((p) => {
        let x = p.pos.x,
          y = p.pos.y,
          farY = y + styles.pill.height,
          farX = x + styles.pill.width;

        let state = 0;

        if (farY >= beakerTopLeft.y) {
          if (
            (x <= beakerTopLeft.x && farX >= beakerTopLeft.x)
            ||
            (x <= beakerTopRight.x && farX >= beakerTopRight.x)) {
            state = -1;
          } else if (x > beakerTopLeft.x && farX < beakerTopRight.x) {
            if (farY >= beakerBottomLeft.y) {
              state = 1;
              y = beakerBottomLeft.y - styles.pill.height;
            }
          }

        }
        if (y >= HEIGHT) {
          state = -1;
        }
        return {
          ...p,
          pos: { x: x, y: y },
          state: state,
        }
      }).filter((p) => p.state !== -1);

    const activePills = validPills.filter((p) => p.state === 0);

    if (activePills.length > 0) {
      activePills[0].pos.x = activePills[0].pos.x + deltaX;
      activePills[0].pos.y = activePills[0].pos.y + deltaY;
    }

    this.setState({
      pills: validPills,
      score: validPills.filter((p) => p.state === 1).length,
      itsStillGood: activePills.length > 0,
      speed: this.state.speed * (validPills.length !== this.state.pills.length ? SPEEDDELTA : 1)
    });

    if (activePills.length === 0 && this.state.score > VICTORYSCORE && this.state.victoryAnim.y > -styles.plane.height) {
      this.runVictoryAnimation();
    }

  };

  render() {
    return this.state.preInit ? (
      <View style={styles.container}>
        {!this.state.fontsLoaded ? <Text>Loading...</Text> :
          <View style={[styles.text, { top: HEIGHT / 3 }]}>
            <Text style={{ textAlign: 'center', fontSize: 48, fontFamily: 'space-grotesk-bold' }}>
              dr. persson
            </Text>
            <TouchableHighlight onPress={this.init}>
              <View style={{ backgroundColor: '#fff', padding: 15, paddingBottom: 20, margin: 15 }}>
                <Text style={{ textAlign: 'center', fontSize: 32, fontFamily: 'space-grotesk-regular' }}>
                  start game
                    </Text>
              </View>
            </TouchableHighlight>
          </View>
        }
      </View>
    ) : (
        <GameLoop style={styles.container} onUpdate={this.updateHandler}>
          {this.state.itsStillGood || this.state.score < VICTORYSCORE ? null : 
            <Image style={[styles.plane, {top: this.state.victoryAnim.y, left: this.state.victoryAnim.x, opacity: this.state.victoryAnim.opacity, transform: [{scale: this.state.victoryAnim.scale}]}]}
                source={require('./assets/plane.png')}/>
          }

          {this.state.itsStillGood ? null :
            <View style={[styles.text, styles.gameover]}>
              <Text style={{ textAlign: 'center', fontSize: 48, fontFamily: 'space-grotesk-bold' }}>
                {this.scoreString()}
              </Text>
              <TouchableHighlight onPress={this.init}>
                <View style={{ backgroundColor: '#fff', padding: 15, paddingBottom: 20, margin: 15 }}>
                  <Text style={{ textAlign: 'center', fontSize: 32, fontFamily: 'space-grotesk-regular' }}>
                    {this.state.score < MAXSCORE / 4 ? 'try again' : 'play again'}
                  </Text>
                </View>
              </TouchableHighlight>
            </View>
          }

          {!this.state.fontsLoaded || !this.state.itsStillGood ? null :
            <View style={[styles.text, styles.header]}>
              <Text>score:</Text>
              <Text style={{ fontFamily: 'space-grotesk-bold', marginTop: -5 }}>{this.numToText(this.state.score)}</Text>
              <Text>pills left:</Text>
              <Text style={{ fontFamily: 'space-grotesk-bold', marginTop: -5 }}>{this.numToText(this.numPillsLeft())}</Text>
            </View>
          }

          {!this.state.itsStillGood ? null : this.state.pills.map((p, i) => {
            return <Pill key={'pill-' + i} position={[p.pos.x, p.pos.y]} colors={p.colors} />
          })}

          {!this.state.itsStillGood ? null :
            <Image style={styles.beaker} source={require('./assets/beaker.png')} />
          }

          {!this.state.fontsLoaded || !this.state.itsStillGood ? null :
            <Text style={[styles.text, styles.footer]}>dr. persson</Text>
          }
        </GameLoop>
      );
  }
}

const styles = StyleSheet.create({
  plane: {
    position: 'absolute',
    width: 125,
    height: 71,
  },
  container: {
    flex: 1,
    backgroundColor: '#ff0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  beaker: {
    position: 'absolute',
    right: 20,
    bottom: 60,
    height: (WIDTH / 3) * 1.105,
    width: WIDTH / 3
  },
  text: {
    position: 'absolute',
    color: '#000',
  },
  gameover: {
    left: 0,
    width: WIDTH,
    top: HEIGHT / 2 - 50,
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
    width: RADIUS * 5,
    height: RADIUS * 2,
    backgroundColor: "transparent",
    position: "absolute"
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

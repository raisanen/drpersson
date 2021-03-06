import React, { PureComponent } from 'react';
import { StyleSheet, Text, View, TouchableHighlight, Button } from 'react-native';
import { GameLoop } from 'react-native-game-engine';
import { Font } from 'expo';
import Matter from "matter-js";

import { colliders, Pill, Beaker, Persson, Ground, makePill, randomColors, styles as componentStyles } from './src/components';
import { PerssonPlayer } from './src/sound';
import { WIDTH, HEIGHT, MAXSCORE, WINNINGSCORE, INITIALGRAVITY, DELTASPEED } from './src/constants';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ff0',
    alignItems: 'center',
    justifyContent: 'center',
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
    bottom: 5,
    left: 15,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start'
  },
  footerButton: {
    fontFamily: 'icomoon',
    fontSize: 20,
    padding: 5,
    paddingBottom: 10,
    width: 50
  },
  icon: {
    fontFamily: 'icomoon'
  }
});

const numToText = (n) => {
  const uptonineteen = [
    'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'
  ],
    aftertwentyparts = ['', '-one', '-two', '-three', '-four', '-five', '-six', '-seven', '-eight', '-nine'],
    tens = ['twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'],
    translate = [...uptonineteen];

  tens.forEach(t => aftertwentyparts.forEach(a => translate.push(`${t}${a}`)));

  return (n < translate.length) ? translate[n] : 'infinite';
};

// Init engine
const engine = Matter.Engine.create(),
  world = engine.world,
  runner = Matter.Runner.create();

engine.world.gravity = { x: 0, y: 0 };

colliders.forEach((c) => Matter.World.addBody(world, c));
Matter.Runner.run(runner, engine);


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
    personOffset: {},
    personEyebrow: {},
    themePlaying: false,
    paused: false,
  };

  soundPlayer = new PerssonPlayer();

  constructor(props) {
    super(props);

    this.updateHandler = ({ touches, screen, time }) => {
      if (this.state.gameState !== GAMESTATES.started || this.state.paused) {
        return;
      }
      const active = world.bodies.filter(b => b.label === 'pill');
      if (active && active.length > 0) {
        const move = touches.find(x => x.type === "move");
        const deltaX = move ? move.delta.pageX : 0;

        active.forEach((b) => {
          if (!b.isStatic && !b.isSleeping) {
            if (b.position.y > HEIGHT) {
              this.removePill(b);
            } else if (move) {
              Matter.Body.setVelocity(
                b, {
                  x: deltaX,
                  y: b.velocity.y
                }
              );
            } else {
              Matter.Body.setPosition(
                b, {
                  x: b.position.x < 0 ? (WIDTH - b.position.x) : b.position.x % WIDTH,
                  y: b.position.y
                }
              )
            }
          }
        });
      }

      Matter.Engine.update(engine, time.delta);
    };
  };


  componentWillMount() {
    Matter.Events.on(engine, 'collisionStart', (event) => {
      const pairs = event.pairs;
      if (pairs.length > 0) {
        const { bodyA, bodyB } = pairs[0];
        const objA = bodyA.label,
          objB = bodyB.label;

        if (objB === 'pill' && objA === 'beaker') {
          this.updatePills(bodyB, true);
        } else if (objB === 'pill' && objA === 'collider') {
          this.soundPlayer.play('jump');
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
            body: { ...world.bodies.find(b => b.id === p.body.id) }
          }
        })
      });
    });
  }

  async componentDidMount() {
    await Font.loadAsync({
      'space-grotesk-bold': require('./assets/fonts/SpaceGrotesk-Bold.ttf'),
      'space-grotesk-regular': require('./assets/fonts/SpaceGrotesk-Regular.ttf'),
      'icomoon': require('./assets/fonts/IcoMoon-Free.ttf')
    });

    this.setState({ fontsLoaded: true });
    this.playTheme();

    setTimeout(() => this.started(), 3000);
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

  removePill = (body) => {
    this.setState({ pills: this.state.pills.filter(p => p.body.id !== body.id) });
    Matter.World.remove(world, body);
  };


  updatePills = (remove = null, isPoint = false) => {
    if (remove) {
      this.removePill(remove);
      world.gravity.y *= DELTASPEED;
      if (isPoint) {
        this.setState({ score: this.state.score + 1 });
        this.soundPlayer.play('coin');
      } else {
        this.soundPlayer.play('break');
      }
    }
    if (this.state.pillsLeft > 0) {
      const newPill = makePill();
      const colors = randomColors(2);

      Matter.Body.setVelocity(newPill, { x: 0, y: world.gravity.y / INITIALGRAVITY });
      Matter.World.addBody(world, newPill);
      Matter.Engine.update(engine);

      this.setState({
        pills: [...this.state.pills, { body: newPill, colors: { left: colors[0], right: colors[1] } }],
        pillsLeft: this.state.pillsLeft - 1
      });
    } else { // game ended
      const newState = this.state.score >= WINNINGSCORE ? GAMESTATES.won : GAMESTATES.lost;

      this.setState({ gameState: newState });

      if (newState === GAMESTATES.won) {
        setTimeout(() => { this.victory() }, 1000);
      } else {
        setTimeout(() => { this.lost() }, 1000);
      }
    }
  };

  // Animations:
  victory = () => {
    this.soundPlayer.play('flagpole');

    [
      2, 2, -5, 5, -5, 2, -2, 5,
      2, 2, -4, 5, -3, 2, -2, 2,
      2, 2, -3, 5, -3, 2, -1, 0,
    ].forEach((v, i) => {
      setTimeout(() => this.setState({
        personOffset: { top: componentStyles.perssonHead.top + v },
        personEyebrow: { top: componentStyles.personEyebrow.top + v, transform: [{ rotate: i + 'deg' }] }
      }), 70 * i);
    });
  };

  lost = () => {
    this.soundPlayer.play('die');

    [
      0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 3, 3, 4, 5, 6
    ].forEach((v, i) => {
      setTimeout(() => this.setState({
        personOffset: { top: componentStyles.perssonHead.top + v },
        personEyebrow: { top: componentStyles.personEyebrow.top + v, transform: [{ rotate: (-i) + 'deg' }] }
      }), 70 * i);
    });
  };

  started = () => {
    [
      -1, -1, -1, -1, -1, -2, -2,
      -2, -2, -2, -2, -3, -3, -3,
      -3, -3, -4, -4, -4, -4, -4,
      -5,
    ].forEach((v, i) => {
      setTimeout(() => this.setState({
        personEyebrow: { top: componentStyles.personEyebrow.top + v }
      }), 50 * i);
    });
  };

  playTheme = () => {
    this.setState({ themePlaying: true });
    this.soundPlayer.play('theme', true, 0.4);
  };

  pauseTheme = () => {
    this.setState({ themePlaying: false });
    this.soundPlayer.pause('theme');
  };

  toggleGamePaused = () => {
    runner.enabled = this.state.paused;
    this.setState({ paused: !this.state.paused });
  }

  // Subcomponents
  startscreen = () => {
    return !(this.state.fontsLoaded)
      ? <Text>Loading...</Text>
      : (
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
      );
  };

  scoreboard = () => {
    const scoreText = numToText(this.state.score),
      pillsText = numToText(this.state.pillsLeft + 1);

    return !(this.state.fontsLoaded && this.state.gameState === GAMESTATES.started) ? null : (
      <View style={[styles.text, styles.header]}>
        <Text>score:</Text>
        <Text style={{ fontFamily: 'space-grotesk-bold', marginTop: -5 }}>{scoreText}</Text>
        <Text>pills left:</Text>
        <Text style={{ fontFamily: 'space-grotesk-bold', marginTop: -5 }}>{pillsText}</Text>
      </View>
    );
  };

  gameover = () => {
    return !(this.state.fontsLoaded && (this.state.gameState === GAMESTATES.won || this.state.gameState === GAMESTATES.lost)) ? null : (
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

  footer = () => {
    return !(this.state.fontsLoaded) ? null : (
      <View style={[styles.text, styles.footer]}>
        <Text onPress={this.state.themePlaying ? this.pauseTheme : this.playTheme}
          style={[styles.footerButton]}>
            {this.state.themePlaying ? 'volume5' : 'volume2'}
        </Text>
        <Text
          onPress={() => this.toggleGamePaused()}
          style={[styles.footerButton]}>
            {this.state.paused ? 'play3' : 'pause2'}
        </Text>
      </View>
    )
  }

  render() {
    const state = this.state.gameState;

    return (
      <GameLoop style={styles.container} onUpdate={this.updateHandler}>
        {this.state.gameState === GAMESTATES.init && this.startscreen()}
        {this.gameover()}

        {state === GAMESTATES.started
          ? this.scoreboard()
          : <Persson offset={this.state.personOffset} eyebrow={this.state.personEyebrow} />
        }
        {this.state.pills.map((p, i) => {
          return (<Pill key={'pill-' + i} body={p.body} colors={p.colors} />);
        })}
        {state === GAMESTATES.started && <Beaker />}
        {state === GAMESTATES.started && <Ground />}
        {state === GAMESTATES.started && this.footer()}
      </GameLoop>
    );
  }
}

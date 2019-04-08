import { Dimensions } from 'react-native';


export const { width: WIDTH, height: HEIGHT } = Dimensions.get("window");

export const RADIUS = 12;
export const MAXSCORE = 12;
export const WINNINGSCORE = MAXSCORE / 2;
export const VALIDCOLORS = ['#fff', '#000', '#f00'];

export  const INITIALGRAVITY = 0.080;
export const DELTASPEED = 1.067;

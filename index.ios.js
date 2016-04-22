/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 */

import React, {
  AppRegistry,
  Component,
  StyleSheet,
  Text,
  View,
  Dimensions,
  ActivityIndicatorIOS,
  PanResponder
} from 'react-native';
import Swiper from 'react-native-swiper';
import NetworkImage from 'react-native-image-progress';
import Progress from 'react-native-progress';
import RandManager from './RandManager';
import Utils from './Utils';

const NUM_WALLPAPERS = 10;
const DOUBLE_TAP_DELAY = 300; //ms
const DOUBLE_TAP_RADIUS = 20;

var {width, height} = Dimensions.get('window');

class SplashWalls extends Component {

  constructor(props) {
    super(props);

    this.state = {
      wallsJSON: [],
      isLoading: true
    };
    this.imagePanResponder = {};

    this.prevTouchInfo = {
      prevTouchX: 0,
      prevTouchY: 0,
      prevTouchTimeStamp: 0
    };
    this.handlePanResponderGrant = this.handlePanResponderGrant.bind(this);
  }

  fetchWallsJSON() {
    var url = 'http://unsplash.it/list';
    fetch(url)
    .then( response => response.json())
    .then( jsonData => {
      var randomIds = RandManager.uniqueRandomNumbers(NUM_WALLPAPERS, 0, jsonData.length);
      var walls = [];
      randomIds.forEach(randomId => {
        walls.push(jsonData[randomId]);
      });
      this.setState({
        isLoading: false,
        wallsJSON: [].concat(walls)
      });
    })
    .catch( error => console.log('Fetch error ' + error)  );
  }

  isDoubleTap(currentTouchTimeStamp, {x0, y0}) {
    var {prevTouchX, prevTouchY, prevTouchTimeStamp} = this.prevTouchInfo;
    var dt = currentTouchTimeStamp - prevTouchTimeStamp;

    return (dt < DOUBLE_TAP_DELAY && Utils.distance(prevTouchX, prevTouchY, x0, y0) < DOUBLE_TAP_RADIUS);
  }

  handleStartShouldSetPanResponder(e, gestureState) {
    return true;
  }
  handlePanResponderGrant(e, gestureState) {
    var currentTouchTimeStamp = Date.now();

    if(this.isDoubleTap(currentTouchTimeStamp, gestureState)) {
      console.log('Double tap detected');
    }

    this.prevTouchInfo = {
      prevTouchX: gestureState.x0,
      prevTouchY: gestureState.y0,
      prevTouchTimeStamp: currentTouchTimeStamp
    };
  }
  handlePanResponderEnd(e, gestureState) {
    console.log('Finger pulled up from the image');
  }

  componentWillMount() {
    this.imagePanResponder = PanResponder.create({
      onStartShouldSetPanResponder: this.handleStartShouldSetPanResponder,
      onPanResponderGrant: this.handlePanResponderGrant,
      onPanResponderRelease: this.handlePanResponderEnd,
      onPanResponderTerminate: this.handlePanResponderEnd
    });
  }

  componentDidMount() {
    this.fetchWallsJSON();
  }

  renderLoadingMessage() {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicatorIOS
          animating={true}
          color={'#fff'}
          size={'small'} 
          style={{margin: 15}} />
        <Text style={{color: '#fff'}}>Contacting Unsplash</Text>
      </View>
    );
  }

  renderResults() {
    var {wallsJSON, isLoading} = this.state;
    if(!isLoading){
      return (
        <Swiper

        loop={false}

        onMomentumScrollEnd={this.onMomentumScrollEnd}
        
        >
          {wallsJSON.map((wallpaper, index) => {
            return (
              <View key={index}>
                <NetworkImage
                  source={{uri: 'https://unsplash.it/' + wallpaper.width + '/' + wallpaper.height + '?image=' + wallpaper.id}}
                  indicator={Progress.Circle}
                  style={styles.wallpaperImage}
                  indicatorProps={{
                    color: 'rgba(255,255,255)',
                    size: 60,
                    thickness: 7
                  }}

                  {...this.imagePanResponder.panHandlers}
                  >
                    <Text style={styles.label}>Photo by</Text>
                    <Text style={styles.label_authorName}>{wallpaper.author}</Text>
                </NetworkImage>
              </View>
            );
          })}
        </Swiper>
      );
    }
  }

  render() {
    var {isLoading} = this.state;
    if(isLoading) {
      return this.renderLoadingMessage();
    } else {
      return this.renderResults();
    }
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
  loadingContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000'
  },
  wallpaperImage: {
    flex: 1,
    width: width,
    height: height,
    backgroundColor: '#000'
  },
  label: {
    position: 'absolute',
    color: '#fff',
    fontSize: 13,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 2,
    paddingLeft: 5,
    top: 20,
    left: 20,
    width: width/2
  },
  label_authorName: {
    position: 'absolute',
    color: '#fff',
    fontSize: 15,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 2,
    paddingLeft: 5,
    top: 41,
    left: 20,
    fontWeight: 'bold',
    width: width/2
  }
});

AppRegistry.registerComponent('SplashWalls', () => SplashWalls);

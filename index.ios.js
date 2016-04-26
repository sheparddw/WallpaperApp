/**
 * Wallpaper App
 * Author: Daniel Shepard
 * https://github.com/sheparddw
 */

import React, {
  AppRegistry,
  Component,
  StyleSheet,
  Text,
  View,
  Dimensions,
  ActivityIndicatorIOS,
  PanResponder,
  CameraRoll
} from 'react-native';
import Swiper from 'react-native-swiper';
import NetworkImage from 'react-native-image-progress';
import Progress from 'react-native-progress';
import ShakeEvent from 'react-native-shake-event-ios';
import RandManager from './RandManager';
import ProgressHUD from './ProgressHUD';
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
      isLoading: true,
      isHudVisible: false,
      hudMsg: "Saving..."
    };
    this.imagePanResponder = {};
    this.currentWallIndex = 0;

    this.prevTouchInfo = {
      prevTouchX: 0,
      prevTouchY: 0,
      prevTouchTimeStamp: 0
    };
    this.handlePanResponderGrant = this.handlePanResponderGrant.bind(this);
    this.onMomentumScrollEnd = this.onMomentumScrollEnd.bind(this);
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
      this.saveCurrentWallpaperToCameraRoll();
    }

    this.prevTouchInfo = {
      prevTouchX: gestureState.x0,
      prevTouchY: gestureState.y0,
      prevTouchTimeStamp: currentTouchTimeStamp
    };
  }
  handlePanResponderEnd(e, gestureState) {
  }

  onMomentumScrollEnd(e, state, context) {
    this.currentWallIndex = state.index;
  }

  saveCurrentWallpaperToCameraRoll() {
    this.setState({isHudVisible: true});

    var {wallsJSON} = this.state;
    var currentWall = wallsJSON[this.currentWallIndex];
    var currentWallURL = 'http://unsplash.it/' + currentWall.width + '/' + currentWall.height + '?image=' + currentWall.id;

    CameraRoll.saveImageWithTag(currentWallURL).then(data => {
      //Confirm that the photo was saved
      this.setState({hudMsg: "Saved to Camera Roll"});
      //Hide HUD and reset HUD Message
      setTimeout(() => this.setState({isHudVisible: false, hudMsg: "Saving..."}), 500);
    }).catch(err => {
      //In case of an error, display it.
      this.setState({hudMsg: "Error saving to camera roll:" + err});
      //Give a little time for err to display.
      setTimeout(() => this.setState({isHudVisible: false, hudMsg: "Saving..."}), 900);
      console.log('Error saving to camera roll', err);
    });
  }

  componentWillMount() {
    this.imagePanResponder = PanResponder.create({
      onStartShouldSetPanResponder: this.handleStartShouldSetPanResponder,
      onPanResponderGrant: this.handlePanResponderGrant,
      onPanResponderRelease: this.handlePanResponderEnd,
      onPanResponderTerminate: this.handlePanResponderEnd
    });

    ShakeEvent.addEventListener('shake', () => {
      this.initialize();
      this.fetchWallsJSON();
    });
  }

  initialize() {
    this.setState({
      wallsJSON: [],
      isLoading: true,
      hudMsg: "Saving...",
      isHudVisible: false
    });
    this.currentWallIndex = 0;
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
    var {wallsJSON, isLoading, isHudVisible, hudMsg} = this.state;
    if(!isLoading){
      return (
        <View>
          <Swiper
          loop={false}
          onMomentumScrollEnd={this.onMomentumScrollEnd}
          index={this.currentWallIndex}
          bounces={true}
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
          <ProgressHUD width={width} height={height} isVisible={isHudVisible} msg={hudMsg}/>
        </View>
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

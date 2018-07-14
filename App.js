/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */
import React from 'react';
import { StyleSheet, View, NativeAppEventEmitter, NativeModules, NativeEventEmitter } from 'react-native';
import Intro from './Views/Intro/Intro.js';
import Chat from './Views/Chat/Chat.js';
import IntroModal from './Views/Modal/IntroModal.js';
import PropTypes from 'prop-types';

import firebase from './Settings/Firebase.js';
// var SoundPlayer = require('react-native-sound');
var SpeechToText = require('react-native-speech-to-text-ios');
var _ = require('lodash');
import Tts from 'react-native-tts';


// const instructions = Platform.select({
//   ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
//   android:
//     'Double tap R on your keyboard to reload,\n' +
//     'Shake or press menu button for dev menu',
// });

var song = null;
var date = new Date();
var date2 = date.getFullYear().toString().slice(2) + '년 ' + (date.getMonth() + 1) + '월 ' + date.getDay() + '일 ' + date.getHours() + ':' + date.getMinutes();

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: null,
      eventNumber: 0,//firebase에서 시작할 때 불러오자.
      currentDatas: null,
      modalVisible: true,
      pageState: 'intro',
      toggleValue: false,
      myMsgs: null,
      sttResults: null,
      stopperCount: 0,
    }
  }

  componentWillMount() {
    // song = new SoundPlayer('https://d1.awsstatic.com/product-marketing/Polly/voices/seoyeon.9dbe36e9490fba13c2387ad65c6b69517bfbf7b5.wav', null, (error) => {
    //   if (error) {
    //     ToastAndroid.show('Error where init Sound Player :(((', ToastAndroid.SHORT);
    //   } else {
    //     song.play();
    //   }
    // });
  }

  componentDidMount() {
    // firebase.database().goOnline();
    Tts.setDefaultLanguage('ko-KR');
    var renderData;
    var latestEventNumber = 0;
    // ** recent codes **
    var eventRef = firebase.database().ref('event-datas');
    eventRef.on('value', (snapshot) => {
      renderData = snapshot.val();
      latestEventNumber = renderData.length - 1;
      this.setState({
        currentDatas: renderData,
        eventNumber: latestEventNumber,
      });
    });

    //   var eventRef = firebase.database().ref('event-datas');
    // eventRef.once('value').then((snapshot) => {
    //   renderData = snapshot.val();
    //   console.warn(renderData)
    //   let latestEventNumber = 0;
    //   for (let key in renderData) {
    //     // if (latestEventNumber < key.eventNumber) {
    //     //   latestEventNumber = key.eventNumber
    //     // }



    this.subscription = NativeAppEventEmitter.addListener(
      'SpeechToText',
      (result) => {
        if (result.error) {
          console.warn(JSON.stringify(result.error));
        } else {
          if (result.bestTranscription.formattedString.includes('전송')) {
            let sttResult = result.bestTranscription.formattedString.slice(0, -2);
            this.setState({
              sttResults: sttResult,
            })
            SpeechToText.finishRecognition();
            SpeechToText.startRecognition('ko-KR');
          }
        }
      }
    );

    const ee = new NativeEventEmitter(NativeModules.TextToSpeech);
    ee.addListener('tts-start', () => { });
    ee.addListener('tts-finish', () => { });
    ee.addListener('tts-cancel', () => { });

  }

  onPressButtonPlay() {
    // if (song !== null) {
    //   song.play(((success) => {
    //     if (!success) {
    //       ToastAndroid.show('Error where play Sound Player :(((', ToastAndroid.SHORT);
    //     }
    //   }));
    // }

    SpeechToText.startRecognition("ko-KR");
  }

  offPressButtonPlay() {
    // Tts.stop();
    // SpeechToText.finishRecognition();
    // console.warn(this.state.sttResults);
    SpeechToText.finishRecognition();
    // Tts.getInitStatus().then(() => {
    setTimeout(() => { Tts.speak(this.state.sttResults); }, 500)


    setTimeout(() => { SpeechToText.startRecognition('ko-KR'); }, 5000)
    // });
  }

  pageStateChange(pageName) {
    this.setState({
      pageState: pageName,
    });
  }

  updateToggleValue(val) {
    this.setState({
      toggleValue: val
    });
  }

  sendMyMsg(text) {
    let eventData = {
      type: 'Msg',
      created_at: Date().toLocaleString().slice(4, 21),
      nickname: this.state.username,
      message: {
        text: text,
        on_voice_mode: false,
        voice_url: null,
      }
    }
    this.setState({
      myMsgs: eventData,
    })
    let eventNumber = this.state.eventNumber + 1;
    // ** recent codes **
    var eventRef = firebase.database().ref(`/event-datas/${eventNumber}`);
    eventRef.update(eventData);
  }

  setModalVisible(visible) {
    let eventData = {
      type: 'join',
      created_at: Date().toLocaleString().slice(4, 21),
      nickname: this.state.username,
    }
    let eventNumber = this.state.eventNumber + 1;
    // ** recent codes **
    var eventRef = firebase.database().ref(`/event-datas/${eventNumber}`);
    eventRef.update(eventData);
    var userRef = firebase.database().ref(`/current-users/${eventNumber}`);
    userRef.update({ nickname: this.state.username });
    this.setState({
      modalVisible: visible,
    });


    // firebase.database().goOnline();
    // ref.update({
    //   face: 'false??'
    // });
    // firebase.database().goOffline();
  }

  usernameInput(username) {
    if (username) {
      this.setState({
        username: username
      })
    } else {
      this.setState({
        username: null
      })
    }
  }

  render() {

    return (
      <View style={appStyles.container}>
        {
          this.state.pageState === 'Chat' &&
          <IntroModal
            modalVisible={this.state.modalVisible}
            text={this.state.text}
            usernameInput={(text) => {

              this.usernameInput(text)
            }}
            username={this.state.username}
            setModalVisible={() => {
              this.setModalVisible(!this.state.modalVisible);
            }}
          />
        }
        {
          this.state.pageState === 'intro' &&
          <Intro
            onPressButtonPlay={(key) => {
              if (key === 'on') {
                this.onPressButtonPlay();
              } else {
                this.offPressButtonPlay();
              }
            }}
            pageStateChange={(pageName) => {
              this.pageStateChange(pageName);
            }}
          />
        }
        {
          this.state.pageState === 'Chat' &&
          <Chat
            currentDatas={this.state.currentDatas}
            myMsgs={this.state.myMsgs}
            username={this.state.username}
            userDatas={this.state.users}
            msgDatas={this.state.messages}
            toggleValue={this.state.toggleValue}
            toggleValueChange={(val) => {
              this.updateToggleValue(val);
            }}
            sendMyMsg={(text) => {
              this.sendMyMsg(text);
            }}
          />
        }
      </View>

    );
  }
};

const appStyles = StyleSheet.create({
  container: {
    flex: 1,
  }
});


// App.propTypes = {
//   props: PropTypes.string
// }

// type Props = {};

// export default class App extends Component<Props> {
//   render() {
//     return (
//       <View style={styles.container}>
//         <Text style={styles.welcome}>Welcome to React Native!</Text>
//         <Text style={styles.instructions}>To get started, edit App.js</Text>
//         <Text style={styles.instructions}>{instructions}</Text>
//         <Text style={styles.instructions}>Hello, Android by Redant</Text>
//       </View>
//     );
//   }
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#F5FCFF',
//   },
//   welcome: {
//     fontSize: 20,
//     textAlign: 'center',
//     margin: 10,
//   },
//   instructions: {
//     textAlign: 'center',
//     color: '#333333',
//     marginBottom: 5,
//   },
// });

App.propTypes = {

};
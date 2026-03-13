import React, {useState, useRef} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Modal,
  FlatList,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import Video from 'react-native-video';

const {width: screenWidth} = Dimensions.get('window');

const App = () => {
  const [videoUri, setVideoUri] = useState(null);
  const [paused, setPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedModal, setShowSpeedModal] = useState(false);
  const videoRef = useRef(null);
  
  const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
  
  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.video],
      });
      setVideoUri(result[0].uri);
      setCurrentTime(0);
      setDuration(0);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
      } else {
        Alert.alert('Error', 'Failed to pick video');
      }
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleProgress = (data) => {
    setCurrentTime(data.currentTime);
  };

  const handleLoad = (data) => {
    setDuration(data.duration);
  };

  const togglePlay = () => {
    setPaused(!paused);
  };

  const handleSeek = (direction) => {
    const newTime = direction === 'forward' 
      ? Math.min(currentTime + 10, duration) 
      : Math.max(currentTime - 10, 0);
    videoRef.current?.seek(newTime);
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (delta) => {
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVolume);
  };

  const handleSpeedChange = (speed) => {
    setPlaybackRate(speed);
    setShowSpeedModal(false);
  };

  const skipTo = (time) => {
    videoRef.current?.seek(time);
    setCurrentTime(time);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Video Player</Text>
        
        {videoUri ? (
          <View style={styles.playerContainer}>
            <Video
              ref={videoRef}
              source={{uri: videoUri}}
              style={styles.video}
              paused={paused}
              volume={volume}
              rate={playbackRate}
              onProgress={handleProgress}
              onLoad={handleLoad}
              resizeMode="contain"
              repeat={false}
            />
            
            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => handleSeek('backward')}>
                <Text style={styles.controlText}>-10s</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.controlButton, styles.playButton]}
                onPress={togglePlay}>
                <Text style={styles.playButtonText}>
                  {paused ? 'Play' : 'Pause'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => handleSeek('forward')}>
                <Text style={styles.controlText}>+10s</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.progressContainer}>
              <Text style={styles.timeText}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Text>
              <TouchableOpacity 
                style={styles.progressBar}
                activeOpacity={1}
                onPress={(e) => {
                  const x = e.nativeEvent.locationX;
                  const percent = x / (screenWidth - 40);
                  const newTime = percent * duration;
                  skipTo(newTime);
                }}
              >
                <View
                  style={[
                    styles.progressFill,
                    {width: `${(currentTime / duration) * 100 || 0}%`},
                  ]}
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.extraControls}>
              <View style={styles.volumeControl}>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => handleVolumeChange(-0.1)}>
                  <Text style={styles.smallButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.volumeText}>{Math.round(volume * 100)}%</Text>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => handleVolumeChange(0.1)}>
                  <Text style={styles.smallButtonText}>+</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={styles.speedButton}
                onPress={() => setShowSpeedModal(true)}>
                <Text style={styles.speedButtonText}>{playbackRate}x</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.changeButton}
              onPress={pickVideo}>
              <Text style={styles.changeButtonText}>Change Video</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>No video selected</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={pickVideo}>
              <Text style={styles.selectButtonText}>Select Video</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.info}>
          <Text style={styles.infoTitle}>Features</Text>
          <Text style={styles.infoText}>- Select video from device</Text>
          <Text style={styles.infoText}>- Play/Pause</Text>
          <Text style={styles.infoText}>- Seek +/-10 seconds</Text>
          <Text style={styles.infoText}>- Volume control</Text>
          <Text style={styles.infoText}>- Playback speed 0.5x-2.0x</Text>
          <Text style={styles.infoText}>- Tap progress bar to seek</Text>
        </View>
      </ScrollView>
      
      <Modal
        visible={showSpeedModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSpeedModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSpeedModal(false)}
        >
          <View style={styles.speedModalContent}>
            <Text style={styles.speedModalTitle}>Playback Speed</Text>
            <FlatList
              data={speeds}
              keyExtractor={(item) => item.toString()}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[
                    styles.speedOption,
                    playbackRate === item && styles.speedOptionActive,
                  ]}
                  onPress={() => handleSpeedChange(item)}
                >
                  <Text style={[
                    styles.speedOptionText,
                    playbackRate === item && styles.speedOptionTextActive,
                  ]}>
                    {item}x
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  playerContainer: {
    backgroundColor: '#000',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1a1a1a',
  },
  controlButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: '#333',
    borderRadius: 8,
    marginHorizontal: 8,
  },
  controlText: {
    color: '#fff',
    fontSize: 14,
  },
  playButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 25,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    padding: 15,
    backgroundColor: '#1a1a1a',
  },
  timeText: {
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
    fontSize: 14,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ff6b6b',
  },
  extraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#1a1a1a',
  },
  volumeControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallButton: {
    padding: 8,
    backgroundColor: '#333',
    borderRadius: 5,
    width: 36,
    alignItems: 'center',
  },
  smallButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  volumeText: {
    color: '#fff',
    marginHorizontal: 10,
    fontSize: 14,
    minWidth: 50,
    textAlign: 'center',
  },
  speedButton: {
    backgroundColor: '#4ecdc4',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 15,
  },
  speedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  changeButton: {
    backgroundColor: '#4ecdc4',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  changeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  placeholder: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 20,
  },
  selectButton: {
    backgroundColor: '#4ecdc4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  selectButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  info: {
    padding: 15,
    backgroundColor: '#e8f4f8',
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    color: '#555',
    fontSize: 14,
    marginBottom: 5,
    lineHeight: 22,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speedModalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '70%',
    maxHeight: '60%',
  },
  speedModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  speedOption: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 5,
    backgroundColor: '#f0f0f0',
  },
  speedOptionActive: {
    backgroundColor: '#4ecdc4',
  },
  speedOptionText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#333',
  },
  speedOptionTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default App;

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
  ActivityIndicator,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import Video from 'react-native-video';

const App = () => {
  const [videoUri, setVideoUri] = useState(null);
  const [paused, setPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const videoRef = useRef(null);

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
        // 用户取消了选择
      } else {
        Alert.alert('错误', '选择视频失败');
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleProgress = (data) => {
    setCurrentTime(data.currentTime);
  };

  const handleLoad = (data) => {
    setDuration(data.duration);
    setLoading(false);
  };

  const togglePlay = () => {
    setPaused(!paused);
  };

  const handleSeek = (direction) => {
    const newTime = direction === 'forward' ? currentTime + 10 : currentTime - 10;
    videoRef.current?.seek(newTime);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>视频播放器</Text>
        
        {videoUri ? (
          <View style={styles.playerContainer}>
            <Video
              ref={videoRef}
              source={{uri: videoUri}}
              style={styles.video}
              paused={paused}
              onProgress={handleProgress}
              onLoad={handleLoad}
              resizeMode="contain"
            />
            
            <View style={styles.controls}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => handleSeek('backward')}>
                <Text style={styles.controlText}>-10秒</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.controlButton, styles.playButton]}
                onPress={togglePlay}>
                <Text style={styles.playButtonText}>
                  {paused ? '▶️ 播放' : '⏸️ 暂停'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.controlButton}
                onPress={() => handleSeek('forward')}>
                <Text style={styles.controlText}>+10秒</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.progressContainer}>
              <Text style={styles.timeText}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </Text>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {width: `${(currentTime / duration) * 100 || 0}%`},
                  ]}
                />
              </View>
            </View>
            
            <TouchableOpacity
              style={styles.changeButton}
              onPress={pickVideo}>
              <Text style={styles.changeButtonText}>📂 更换视频</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderText}>还没有选择视频</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={pickVideo}>
              <Text style={styles.selectButtonText}>📁 选择视频文件</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.info}>
          <Text style={styles.infoText}>
            点击上方按钮选择手机里的视频文件
          </Text>
        </View>
      </ScrollView>
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
  infoText: {
    color: '#555',
    textAlign: 'center',
    fontSize: 14,
  },
});

export default App;

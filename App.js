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
  Dimensions,
  Platform,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';
import Video from 'react-native-video';
import RNFS from 'react-native-fs';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const App = () => {
  const [videoUri, setVideoUri] = useState(null);
  const [paused, setPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1.0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [showSpeedModal, setShowSpeedModal] = useState(false);
  const [showSubtitleModal, setShowSubtitleModal] = useState(false);
  const [subtitleUri, setSubtitleUri] = useState(null);
  const [showCacheModal, setShowCacheModal] = useState(false);
  const [cachedVideos, setCachedVideos] = useState([]);
  const [isCaching, setIsCaching] = useState(false);
  const [cacheProgress, setCacheProgress] = useState(0);
  
  const videoRef = useRef(null);
  const speeds = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
  
  // 缓存目录
  const cacheDir = RNFS.CachesDirectoryPath + '/videos';
  
  // 初始化缓存目录
  const initCacheDir = async () => {
    try {
      const exists = await RNFS.exists(cacheDir);
      if (!exists) {
        await RNFS.mkdir(cacheDir);
      }
      // 读取已缓存的视频
      const files = await RNFS.readDir(cacheDir);
      setCachedVideos(files.filter(f => f.name.endsWith('.mp4')));
    } catch (e) {
      console.log('Init cache dir error:', e);
    }
  };
  
  // 初始化
  React.useEffect(() => {
    initCacheDir();
  }, []);
  
  // 选择视频
  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.video],
      });
      setVideoUri(result[0].uri);
      setCurrentTime(0);
      setDuration(0);
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('错误', '选择视频失败');
      }
    }
  };
  
  // 选择字幕
  const pickSubtitle = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      const uri = result[0].uri;
      if (uri.endsWith('.srt') || uri.endsWith('.vtt') || uri.endsWith('.txt')) {
        setSubtitleUri(uri);
        setShowSubtitleModal(false);
        Alert.alert('成功', '字幕文件已加载');
      } else {
        Alert.alert('提示', '请选择 SRT 或 VTT 格式的字幕文件');
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        Alert.alert('错误', '选择字幕失败');
      }
    }
  };
  
  // 缓存视频
  const cacheVideo = async () => {
    if (!videoUri) return;
    
    try {
      setIsCaching(true);
      setCacheProgress(0);
      
      const fileName = `video_${Date.now()}.mp4`;
      const destPath = cacheDir + '/' + fileName;
      
      // 注意：实际项目中需要处理 file:// 前缀
      const sourcePath = videoUri.replace('file://', '');
      
      await RNFS.copyFile(sourcePath, destPath);
      
      // 刷新缓存列表
      const files = await RNFS.readDir(cacheDir);
      setCachedVideos(files.filter(f => f.name.endsWith('.mp4')));
      
      Alert.alert('成功', '视频已缓存到本地');
    } catch (e) {
      Alert.alert('错误', '缓存失败: ' + e.message);
    } finally {
      setIsCaching(false);
      setCacheProgress(0);
    }
  };
  
  // 播放缓存视频
  const playCachedVideo = (file) => {
    setVideoUri('file://' + file.path);
    setShowCacheModal(false);
    setCurrentTime(0);
    setDuration(0);
  };
  
  // 删除缓存
  const deleteCachedVideo = async (file) => {
    try {
      await RNFS.unlink(file.path);
      const files = await RNFS.readDir(cacheDir);
      setCachedVideos(files.filter(f => f.name.endsWith('.mp4')));
      Alert.alert('成功', '缓存已删除');
    } catch (e) {
      Alert.alert('错误', '删除失败');
    }
  };
  
  // 格式化时间
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
        <Text style={styles.title}>视频播放器</Text>
        
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
            
            {/* 字幕显示区域 */}
            {subtitleUri && (
              <View style={styles.subtitleContainer}>
                <Text style={styles.subtitleText}>字幕已加载</Text>
              </View>
            )}
            
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
            
            {/* 音量控制 */}
            <View style={styles.extraControls}>
              <View style={styles.volumeControl}>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => handleVolumeChange(-0.1)}>
                  <Text style={styles.smallButtonText}>🔈</Text>
                </TouchableOpacity>
                <Text style={styles.volumeText}>{Math.round(volume * 100)}%</Text>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={() => handleVolumeChange(0.1)}>
                  <Text style={styles.smallButtonText}>🔊</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={styles.speedButton}
                onPress={() => setShowSpeedModal(true)}>
                <Text style={styles.speedButtonText}>{playbackRate}x</Text>
              </TouchableOpacity>
            </View>
            
            {/* 功能按钮 */}
            <View style={styles.functionButtons}>
              <TouchableOpacity
                style={styles.functionButton}
                onPress={pickSubtitle}>
                <Text style={styles.functionButtonText}>📝 字幕</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.functionButton}
                onPress={cacheVideo}
                disabled={isCaching}>
                <Text style={styles.functionButtonText}>
                  {isCaching ? `缓存中 ${Math.round(cacheProgress)}%` : '💾 缓存'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.functionButton}
                onPress={() => {initCacheDir(); setShowCacheModal(true);}}>
                <Text style={styles.functionButtonText}>📁 缓存</Text>
              </TouchableOpacity>
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
            
            <TouchableOpacity
              style={[styles.selectButton, {marginTop: 15, backgroundColor: '#ff6b6b'}]}
              onPress={() => {initCacheDir(); setShowCacheModal(true);}}>
              <Text style={styles.selectButtonText}>📁 播放缓存视频</Text>
            </TouchableOpacity>
          </View>
        )}
        
        <View style={styles.info}>
          <Text style={styles.infoTitle}>📋 功能说明</Text>
          <Text style={styles.infoText}>• 点击"选择视频"按钮选择手机里的视频文件</Text>
          <Text style={styles.infoText}>• 播放/暂停视频</Text>
          <Text style={styles.infoText}>• ±10秒快进快退</Text>
          <Text style={styles.infoText}>• 调节音量大小</Text>
          <Text style={styles.infoText}>• 0.5x-2.0x 倍速播放</Text>
          <Text style={styles.infoText}>• 点击进度条跳转</Text>
          <Text style={styles.infoText}>• 加载字幕文件（SRT/VTT）</Text>
          <Text style={styles.infoText}>• 视频缓存到本地</Text>
          <Text style={styles.infoText}>• 播放已缓存视频</Text>
        </View>
      </ScrollView>
      
      {/* 倍速选择弹窗 */}
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
            <Text style={styles.speedModalTitle}>选择播放速度</Text>
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
      
      {/* 字幕选择弹窗 */}
      <Modal
        visible={showSubtitleModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSubtitleModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSubtitleModal(false)}
        >
          <View style={styles.speedModalContent}>
            <Text style={styles.speedModalTitle}>字幕功能</Text>
            <TouchableOpacity
              style={styles.speedOption}
              onPress={pickSubtitle}
            >
              <Text style={styles.speedOptionText}>📂 选择字幕文件</Text>
            </TouchableOpacity>
            {subtitleUri && (
              <TouchableOpacity
                style={[styles.speedOption, styles.speedOptionActive]}
                onPress={() => {setSubtitleUri(null); setShowSubtitleModal(false);}}
              >
                <Text style={[styles.speedOptionText, styles.speedOptionTextActive]}>❌ 清除字幕</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* 缓存管理弹窗 */}
      <Modal
        visible={showCacheModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCacheModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCacheModal(false)}
        >
          <View style={[styles.speedModalContent, {maxHeight: '70%'}]}>
            <Text style={styles.speedModalTitle}>本地缓存视频</Text>
            {cachedVideos.length === 0 ? (
              <Text style={{textAlign: 'center', color: '#666', padding: 20}}>
                暂无缓存视频
              </Text>
            ) : (
              <FlatList
                data={cachedVideos}
                keyExtractor={(item) => item.name}
                renderItem={({item}) => (
                  <View style={styles.cacheItem}>
                    <TouchableOpacity
                      style={styles.cacheItemButton}
                      onPress={() => playCachedVideo(item)}
                    >
                      <Text style={styles.cacheItemText} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.cacheItemSize}>
                        {(item.size / 1024 / 1024).toFixed(1)} MB
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => deleteCachedVideo(item)}
                    >
                      <Text style={styles.deleteButtonText}>删除</Text>
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
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
  subtitleContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    alignItems: 'center',
  },
  subtitleText: {
    color: '#fff',
    fontSize: 12,
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
  },
  smallButtonText: {
    fontSize: 18,
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
  functionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#1a1a1a',
  },
  functionButton: {
    backgroundColor: '#45b7d1',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  functionButtonText: {
    color: '#fff',
    fontSize: 14,
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
  cacheItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cacheItemButton: {
    flex: 1,
  },
  cacheItemText: {
    fontSize: 14,
    color: '#333',
  },
  cacheItemSize: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    padding: 8,
    backgroundColor: '#ff6b6b',
    borderRadius: 5,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
  },
});

export default App;

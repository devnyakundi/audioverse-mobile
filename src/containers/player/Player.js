import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import { ImageBackground, View, TouchableOpacity, StatusBar, Platform, StyleSheet } from 'react-native'
import Icon from 'react-native-vector-icons/Feather'
import ActionSheet from 'react-native-action-sheet'

import ListItem from 'src/components/list/ListItem'
import PlayerContent from './PlayerContent'
import ProgressBar from 'src/components/progressbar/ProgressBar'
import PlayerControls from './PlayerControls'
import PlayerOptions from './PlayerOptions'
import imageBg from 'assets/bg.png'
import I18n from 'locales'
import { Dirs } from 'src/constants'

class Player extends PureComponent {

  handleDownload = () => {
	
    let bitratesIndex = [], options = []

    const getSize = size => (
      parseInt(size) > 0 ? `${Math.round((parseInt(size)/8)/100000)} MB` : ''
    )

    const { track, language, actions } = this.props
      
    // audio
    for ( let i = track.mediaFiles.length - 1; i >= 0; i-- ) {
      bitratesIndex.push(track.mediaFiles[i])
      options.push(`${track.mediaFiles[i].bitrate} kbps - ${getSize(track.mediaFiles[i].filesize)}`)
    }
    
    // video
    if ( track.videoFiles.length ) {
      for ( let i = track.videoFiles.length - 1; i >= 0; i-- ) {
        if (track.videoFiles[i].container !== 'm3u8_ios') {
          bitratesIndex.push(track.videoFiles[i])
          options.push(`MP4 (${track.videoFiles[i].width} x ${track.videoFiles[i].height}) - ${getSize(track.videoFiles[i].filesize)}`)
        }
      }
    }
    
    options.push(I18n.t('Cancel', {locale: language}))

    ActionSheet.showActionSheetWithOptions({
      title: I18n.t('Select_a_bitrate_to_download', {locale: language}),
      options: options,
      cancelButtonIndex: options.length - 1,
    }, buttonIndex => {
      if (typeof buttonIndex !== 'undefined' && buttonIndex !== options.length - 1) {
        actions.download(
          track,
          Dirs.presentations,
          bitratesIndex[buttonIndex].downloadURL,
          bitratesIndex[buttonIndex].filename,
          bitratesIndex[buttonIndex].bitrate,
        )
      }
    })
  }

  handleOnSetRate = (rate) => {
    const { language, actions } = this.props
    const options = ['0.25', '0.5', '0.75', '1', '1.25', '1.5', '1.75', '2', I18n.t('Cancel', {locale: language})]
    ActionSheet.showActionSheetWithOptions({
      options: options,
      cancelButtonIndex: options.length - 1,
    }, buttonIndex => {
      if (typeof buttonIndex !== 'undefined' && buttonIndex !== options.length - 1) {
        actions.setRate(parseFloat(options[buttonIndex]))
      }
    })
  }

  handlePlayVideo = () => {
    this.props.actions.playVideo(this.props.track)
  }

  render() {
    
    const {
      navigation,
      state,
      track,
      rate,
      language,
      user,
      actions,
      isFavorite
    } = this.props

    if (!track) {
      return <View />
    }

    const rightElement = <TouchableOpacity onPress={() => navigation.goBack()}><Icon name='chevron-down' style={styles.minimizeIcon} /></TouchableOpacity>

    return (
      <ImageBackground
        source={imageBg}
        style={styles.container}>
        <View style={styles.bar}>
          <StatusBar
            backgroundColor="#E53935"
            barStyle="light-content"
          />
          <ListItem
            avatar={{source: track.artwork}}
            title={track.title}
            subtitle={track.artist}
            rightElement={rightElement}
            style={{backgroundColor: '#E0E0E080'}}
            onPress={() => navigation.goBack()}
          />
        </View>
        <PlayerContent
          data={track}
          language={language}
          navigation={navigation} />
        <PlayerOptions
          navigation={navigation}
          track={track}
          onDownload={this.handleDownload}
          rate={rate}
          user={user}
          isFavorite={isFavorite}
          onSetRate={this.handleOnSetRate}
          onAddFavorite={actions.addFavorite}
          onRemoveFavorite={actions.removeFavorite}
          onPlayVideo={this.handlePlayVideo} />
        <View style={styles.bottomContainer}>
          <ProgressBar />
          <PlayerControls
            state={state}
            playPause={actions.playPause}
            skipToPrevious={actions.skipToPrevious}
            skipToNext={actions.skipToNext}
            replay={actions.replay}
            forward={actions.forward} />
        </View>
      </ImageBackground>
    )
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    backgroundColor: '#DDDDDD'
  },
  bar: {
    elevation: 2,
    borderTopWidth: Platform.OS === 'ios' ? 30 : 0,
    borderTopColor: '#E0E0E080',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC'
  },
  minimizeIcon: {
    fontSize: 42
  },
  bottomContainer: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'center'
  }
})

Player.propTypes = {
  navigation: PropTypes.object.isRequired,
  state: Platform.OS == 'ios' ? PropTypes.string : PropTypes.number,
  track: PropTypes.object,
  rate: PropTypes.number.isRequired,
  language: PropTypes.string.isRequired,
  user: PropTypes.object,
  isFavorite: PropTypes.bool.isRequired,
  actions: PropTypes.shape({
    playPause: PropTypes.func.isRequired,
    skipToPrevious: PropTypes.func.isRequired,
    skipToNext: PropTypes.func.isRequired,
    replay: PropTypes.func.isRequired,
    forward: PropTypes.func.isRequired,
    setRate: PropTypes.func.isRequired,
    download: PropTypes.func.isRequired,
    addFavorite: PropTypes.func.isRequired,
    removeFavorite: PropTypes.func.isRequired,
    playVideo: PropTypes.func.isRequired
  })
}

export default Player

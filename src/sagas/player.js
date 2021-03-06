import { Platform } from 'react-native'
import TrackPlayer from 'react-native-track-player'
import { call, put, select } from 'redux-saga/effects'
import RNFetchBlob from 'rn-fetch-blob'

import { MediaTypes, Dirs } from 'src/constants'
import * as actions from 'src/actions'
import * as selectors from 'src/reducers/selectors'
import { getMediaFile } from 'src/utils'
import NavigationService from 'src/utils/navigation-service'

const DOWNLOAD_DIR = Platform.OS === 'ios' ? RNFetchBlob.fs.dirs.DocumentDir : RNFetchBlob.fs.dirs.DownloadDir
const BIBLE_AND_BOOKS_DIR = Platform.OS === 'ios' ? RNFetchBlob.fs.dirs.DocumentDir : `${RNFetchBlob.fs.dirs.MainBundleDir}/app_appdata`

/**
 * Setup player with all the capabilities needed
 */
export function* setupPlayer() {
  yield call(TrackPlayer.setupPlayer)
  yield call(TrackPlayer.updateOptions, {
    capabilities: [
      TrackPlayer.CAPABILITY_PLAY,
      TrackPlayer.CAPABILITY_PAUSE,
      TrackPlayer.CAPABILITY_SEEK_TO,
      TrackPlayer.CAPABILITY_JUMP_FORWARD,
      TrackPlayer.CAPABILITY_JUMP_BACKWARD,
      TrackPlayer.CAPABILITY_SKIP_TO_NEXT,
      TrackPlayer.CAPABILITY_SKIP_TO_PREVIOUS,
      TrackPlayer.CAPABILITY_PLAY_FROM_ID, // required for android auto
      TrackPlayer.CAPABILITY_PLAY_FROM_SEARCH // required for android auto
    ],
    compactCapabilities: [
      TrackPlayer.CAPABILITY_PLAY,
      TrackPlayer.CAPABILITY_PAUSE,
      TrackPlayer.CAPABILITY_SEEK_TO,
      TrackPlayer.CAPABILITY_SKIP_TO_NEXT,
      TrackPlayer.CAPABILITY_SKIP_TO_PREVIOUS
    ],
    stopWithApp: false
  })
  yield put(actions.playbackInit())
}

/**
 * File exists
 * @param {string} file 
 */
const fileExists = async (file) => {
  try {
    return await RNFetchBlob.fs.exists(file)
  } catch(err) {
    return false
  }
}

/**
 * Get sermon url
 * @param {object} item
 */
function* getSermonUrl(item) {

  const downloads = yield select(selectors.getDownloadsById, item.id)

  let bitRate = null
  if (!item.bitRate) {
    // get the bit rate from the settings
    bitRate = yield select(selectors.getBitRate)
  } else {
    // use the bit rate provided in the object
    bitRate = item.bitRate
  }
  
  const mediaFile = getMediaFile(item.mediaFiles, bitRate)

  let url = mediaFile.downloadURL

  const download = downloads.find( el => el.bitRate === mediaFile.bitrate )

  let currentUrl = null, exists = false

  if (download) {
    currentUrl = `${Platform.OS === 'android' && download.recovered ? download.dir : DOWNLOAD_DIR}/${download.downloadPath}/${encodeURIComponent(download.fileName)}`
    exists = yield call(fileExists, currentUrl)
    if (exists) {
      url = `file://${currentUrl}`
    }
  }

  // if it doesn't exist, look for a different bit rate available
  if (!exists) {
    const others = downloads.filter( el => el.bitRate !== mediaFile.bitrate )
    for (let i of others) {
      currentUrl = `${Platform.OS === 'android' && download.recovered ? download.dir : DOWNLOAD_DIR}/${i.downloadPath}/${encodeURIComponent(i.fileName)}`
      exists = yield call(fileExists, currentUrl)
      if (exists) {
        url = `file://${currentUrl}`
        break
      }
    }
  }
  console.log('url', url)
  return url
}

/**
 * Get book chapter url
 * @param {object} item
 */
function* getBookChapterUrl(item) {

  const download = item.mediaFiles && item.mediaFiles.length ? item.mediaFiles[0] : {}

  let url = download.downloadURL

  const currentUrl = `${BIBLE_AND_BOOKS_DIR}/${Dirs.audiobooks}/${encodeURIComponent(download.filename)}`
  const exists = yield call(fileExists, currentUrl)
  if (exists) {
    url = `file://${currentUrl}`
  }
  console.log('url', url)
  return url
}

/**
 * Get Bible chapter url
 * @param {object} item
 */
function* getBibleChapterUrl(item) {

  let url = item.downloadURL
  const currentUrl = `${BIBLE_AND_BOOKS_DIR}/${Dirs.bible}/${encodeURIComponent(item.fileName)}`
  const exists = yield call(fileExists, currentUrl)
  if (exists) {
    url = `file://${currentUrl}`
  }
  console.log('url', url)
  return url
}

/**
 * Get video url
 * @param {object} item
 */
function* getVideoUrl(item) {

  let url = item.videoFiles && item.videoFiles.length ? item.videoFiles[0].downloadURL : null

  const downloads = yield select(selectors.getDownloadsById, item.id)
  let currentUrl = null, exists = false

  for (let i of downloads) {
    currentUrl = `${i.downloadPath}${encodeURIComponent(i.fileName)}`
    exists = yield call(fileExists, currentUrl)
    if (exists) {
      url = `file://${currentUrl}`
      break
    }
  }
  console.log('url', url)
  return url
}

/**
 * Play video
 * @param {object} item 
 */
export function* playVideo({ item }) {
  const state = yield call(TrackPlayer.getState)
  if (state === TrackPlayer.STATE_PLAYING) {
    yield call(TrackPlayer.pause)
  }
  let videoUrl = yield call(getVideoUrl, item)
  yield call(NavigationService.navigate, 'VideoPlayer', {uri: videoUrl})
}

/**
 * Resets the player, adds the array of tracks to the playlist and starts playing it
 * @param {array} tracks 
 * @param {object} id
 */
export function* resetAndPlayTrack({ tracks, id }) {
  yield call(TrackPlayer.reset)

  const selectedTrack = !id ? tracks[0] : tracks.find(el => el.id === id)

  yield put(actions.playbackTracks(tracks))
  yield put(actions.playbackTrackId(selectedTrack.id))

  const autoPlay = yield select(selectors.getAutoPlay)
  if (autoPlay || selectedTrack.mediaType === MediaTypes.bible) {
    yield call(playTracks)
  } else if (selectedTrack.mediaType !== MediaTypes.bible) {
    yield call(NavigationService.navigate, 'Player')
  }
}

/** 
 * Plays or pauses the current track
*/
export function* playTracks() {

  const tracks = yield select(selectors.getTracks)
  const track = yield select(selectors.getCurrentTrack)

  // Some of the Korean recordings do not have audio
  // in that case play video
  if (track.mediaType === MediaTypes.sermon &&
    track.videoFiles.length &&
    (!track.mediaFiles || track.mediaFiles.length === 0)) {
    yield put(actions.playVideo(track))
    return
  }

  let getUrl = null
  if (track.mediaType === MediaTypes.bible) {
    getUrl = getBibleChapterUrl
  } else if (track.mediaType === MediaTypes.book) {
    getUrl = getBookChapterUrl
  } else {
    getUrl = getSermonUrl
  }

  const newTracks = []
  for (let i of tracks) {
    newTracks.push({
      ...i,
      url: yield call(getUrl, i)
    })
  }

  yield call(setupPlayer)
  yield call(TrackPlayer.add, newTracks)
  yield call(TrackPlayer.skip, track.id)
  yield call(TrackPlayer.play)
}

/** 
 * Plays or pauses the current track
*/
export function* playPause() {
  const tracks = yield call(TrackPlayer.getQueue)
  if (!tracks.length) {
    yield call(playTracks)
  } else {
    const state = yield call(TrackPlayer.getState)
    if (state === TrackPlayer.STATE_PLAYING) {
      yield call(TrackPlayer.pause)
    } else {
      yield call(TrackPlayer.play)
    }
  }
}

/** 
 * Skip to the previous track unless it is not the first one
*/
export function* skipToPrevious() {
  const queue = yield call(TrackPlayer.getQueue)
  const currentTrackId = yield select(selectors.getCurrentTrackId)
  const index = queue.findIndex(item => item.id === currentTrackId )
  
  if (index > 0) {
    yield call(TrackPlayer.skipToPrevious)
  }
}

/** 
 * Skip to the next track unless it is not the last one
*/
export function* skipToNext() {
  const queue = yield call(TrackPlayer.getQueue)
  const currentTrackId = yield select(selectors.getCurrentTrackId)
  const index = queue.findIndex(item => item.id === currentTrackId )
  
  if (queue.length > index + 1) {
    yield call(TrackPlayer.skipToNext)
  }
}

/** 
 * Replays the current track
*/
export function* replay() {
  const seconds = 10
  let position = yield call(TrackPlayer.getPosition)
  position =  position > seconds ? position - seconds : 0
  yield call(TrackPlayer.seekTo, position)
}

/** 
 * Fast-forward the current track
*/
export function* forward() {
  const seconds = 30
  const duration = yield call(TrackPlayer.getDuration)
  let position = yield call(TrackPlayer.getPosition)
  position =  position + seconds <= duration ? position + seconds : duration
  yield call(TrackPlayer.seekTo, position)
}

/** 
 * Sets the player rate
*/
export function* setRate({ rate }) {
  yield call(TrackPlayer.setRate, rate)
  yield put(actions.playbackRate(rate))
}

/** 
 * Sets the player rate
*/
export function* trackInitialized({ track }) {
  track.lastPlayedDate = new Date()
  const history = yield select(selectors.getHistory)
  const exists = history.some(el => el.id === track.id)
  // if it's a sermon and is not in the history list add it
  if (track.mediaType === MediaTypes.sermon && !exists) {
    yield put(actions.history.add([track]))
  }

  // set rate
  const rate = yield select(selectors.getRate)
  if (rate !== 1) {
    yield call(TrackPlayer.setRate, rate)
  }

  // set position
  const position = yield select(selectors.getPosition)
  if (position) {
    yield call(TrackPlayer.seekTo, position)
  }
}

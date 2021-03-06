import React, { PureComponent } from 'react'
import PropTypes from 'prop-types'
import {
  View,
  Alert,
  StyleSheet
} from 'react-native'

import List from 'src/components/list/List'
import ListItem from 'src/components/list/ListItem'
import MiniPlayer from 'src/components/miniplayer'
import IconButton from 'src/components/buttons/IconButton'
import I18n from 'locales'
import { Dirs } from 'src/constants'

class Book extends PureComponent {

  componentDidMount() {
    const { params } = this.props.navigation.state
    this.props.actions.loadBook(false, false, params.url, params.id)
  }

  handleRefresh = () => {
    const { params } = this.props.navigation.state
    this.props.actions.loadBook(false, true, params.url, params.id)
  }

  handlePressItemAction = item => {
    if (item.local) {
      Alert.alert(
        I18n.t('Are_you_sure'),
        '',
        [
          {text: I18n.t('Cancel'), onPress: () => {}, style: 'cancel'},
          {text: I18n.t('Yes'), onPress: () => { this.props.actions.removeLocalChapter(item) }}
        ]
      )
    } else {
      const mediaFile = item.mediaFiles[0]
      this.props.actions.download(
        item,
        Dirs.audiobooks,
        mediaFile.downloadURL,
        mediaFile.filename,
        mediaFile.bitrate,
        this.props.actions.addLocalFiles.bind(this, [item.id])
      )
    }
  }

  renderItem = ({ item }) => {
    return (
      <ListItem
        avatar={{source: item.artwork}}
        title={item.title}
        subtitle={item.artist}
        onPress={() => this.props.actions.resetAndPlayTrack(this.props.items, item.id)}
        rightElement={<RightElement data={item} onPress={this.handlePressItemAction} />}
      />
    )
  }
  
  render() {
    const { items, pagination } = this.props

    return (
      <View style={styles.container}>
        <List renderItem={this.renderItem} items={items} {...pagination} onRefresh={this.handleRefresh} />
        <MiniPlayer navigation={this.props.navigation} />
      </View>
    )
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between'
  }
})

Book.propTypes = {
  navigation: PropTypes.object.isRequired,
  items: PropTypes.array,
  pagination: PropTypes.object,
  actions: PropTypes.shape({
    loadBook: PropTypes.func.isRequired,
    addLocalFiles: PropTypes.func.isRequired,
    removeLocalChapter: PropTypes.func.isRequired,
    download: PropTypes.func.isRequired,
    resetAndPlayTrack: PropTypes.func.isRequired
  })
}

const RightElement = ({ data, onPress }) => {
  const handlePress = () => { onPress(data) }
  return <IconButton onPress={handlePress} name={data.local ? 'x' : 'download'} size={24} />
}

export default Book

import React from 'react'
import { createStackNavigator } from 'react-navigation'

import HeaderLeft from './HeaderLeft'
import HeaderTitle from './headertitle'
import { GlobalStyles, headerTintColor } from 'src/styles'
import Settings from 'src/containers/settings'

const SettingsStack = createStackNavigator({
  Settings: {
    screen: Settings,
    navigationOptions: ({ navigation }) => ({
      headerLeft: <HeaderLeft onPress={navigation.toggleDrawer} />,
      headerTitle: <HeaderTitle title="settings" />,
    })
  }
}, {
  navigationOptions: {
    headerStyle: GlobalStyles.header,
    headerTintColor: headerTintColor
  }
})

SettingsStack.navigationOptions = ({ navigation }) => {
  let drawerLockMode = 'unlocked'
  if (navigation.state.index > 0) {
    drawerLockMode = 'locked-closed'
  }

  return {
    drawerLockMode
  }
}

export default SettingsStack
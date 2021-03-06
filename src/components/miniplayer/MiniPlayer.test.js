import React from 'react'
import MiniPlayer from './'

import { shallow } from 'enzyme'
import configureStore from 'redux-mock-store'

const middlewares = []
const mockStore = configureStore(middlewares)

describe('MiniPlayer component', () => {
  const navigation = { navigate: jest.fn() }
  
  it('renders empty component when no track', () => {
    const initialState = {
      playback: { state: '', tracks: [] }
    }
    const wrapper = shallow(<MiniPlayer navigation={navigation} />, { context: { store: mockStore(initialState) } })
    expect(wrapper.dive()).toMatchSnapshot()
  })

  it('renders correctly when there is a track', () => {
    const initialState = {
      playback: { state: '', tracks: [] }
    }
    const wrapper = shallow(<MiniPlayer navigation={navigation} />, { context: { store: mockStore(initialState) } })
    expect(wrapper.dive()).toMatchSnapshot()
  })
})

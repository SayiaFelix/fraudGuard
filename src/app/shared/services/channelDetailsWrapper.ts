export class ChannelDetailsWrapper {
  public static channelDetailsWrapper = {
    txntimestamp: ChannelDetailsWrapper.getTimeStamp(),
    xref: 1675243286333,
    payload: {},
    channel_details: {
      channel_key: '1223445Pl',
      host: '127.0.0.1',
      geolocation: '',
      user_agent_version: 'Channel manager',
      user_agent: 'Channel manager',
      client_id: 'CHURCHILL',
      deviceId:'87576yuythf77',
      channel: 'CHANNEL-MANAGER'
    }
  }


  private static getTimeStamp() {
    new Date()
  }
}



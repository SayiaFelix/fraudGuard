export class ChannelDetailsWrapper {
  public static channelDetailsWrapper = {
    txntimestamp: ChannelDetailsWrapper.getTimeStamp(),
    xref: 1675243286333,
    payload: {},
    channel_details: {
      channel_key: "1223445Pl",
      host: "127.0.0.1",
      geolocation: "",
      user_agent_version: "Windows 11",
      user_agent: "Windows 11",
      client_id: "CHURCHILL",
      deviceId: "87576yuythf76",
      channel: "IB"
    },
  }


  private static getTimeStamp() {
    new Date()
  }
}



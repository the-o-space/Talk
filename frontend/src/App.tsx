import { useEffect, useRef, useState } from 'react'
import * as Livekit from 'livekit-client'

function App() {
  const gridRef = useRef<HTMLDivElement>(null)
  const [participantCount, setParticipantCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const [localVideoEnabled, setLocalVideoEnabled] = useState(false)

  useEffect(() => {
    // Define functions first before using them
    const addTrack = (track: any, participant: any) => {
      console.log(`Adding ${track.kind} track from ${participant.identity}`)
      
      if (track.kind === 'video') {
        // Create a container for the video
        const container = document.createElement('div')
        container.className = 'relative bg-gray-800 rounded-lg overflow-hidden'
        container.id = `video-${participant.sid}-${track.sid}`
        
        const video = document.createElement('video')
        video.srcObject = new MediaStream([track.mediaStreamTrack])
        video.autoplay = true
        video.playsInline = true
        video.className = 'w-full h-full object-cover'
        
        // Add participant label
        const label = document.createElement('div')
        label.className = 'absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm'
        label.textContent = participant.identity || 'Unknown'
        
        container.appendChild(video)
        container.appendChild(label)
        gridRef.current?.appendChild(container)
        
        console.log('Video element added to grid')
      } else if (track.kind === 'audio') {
        const audio = document.createElement('audio')
        audio.srcObject = new MediaStream([track.mediaStreamTrack])
        audio.autoplay = true
        document.body.appendChild(audio)
        console.log('Audio element added')
      }
    }

    const removeTrack = (track: any, participant: any) => {
      if (track.kind === 'video') {
        const element = document.getElementById(`video-${participant.sid}-${track.sid}`)
        element?.remove()
        console.log('Video element removed')
      }
    }

    const addParticipant = (participant: any) => {
      console.log('Adding participant:', participant.identity)
      
      participant.on('trackSubscribed', (track: any) => addTrack(track, participant))
      participant.on('trackUnsubscribed', (track: any) => removeTrack(track, participant))
      
      participant.trackPublications.forEach((pub: any) => {
        if (pub.isSubscribed && pub.track) {
          addTrack(pub.track, participant)
        }
      })
      
      updateParticipantCount()
    }

    const removeParticipant = (participant: any) => {
      console.log('Removing participant:', participant.identity)
      // Remove all video elements for this participant
      const elements = gridRef.current?.querySelectorAll(`[id^="video-${participant.sid}"]`)
      elements?.forEach(el => el.remove())
      updateParticipantCount()
    }

    const updateParticipantCount = () => {
      const count = gridRef.current?.querySelectorAll('[id^="video-"]').length || 0
      setParticipantCount(count)
    }

    const main = async () => {
      try {
        const res = await fetch('/token')
        const { token } = await res.json()
        console.log('Got token:', token)

        const room = new Livekit.Room()

        // Log all room events for debugging
        room.on('participantConnected', (participant) => {
          console.log('🟢 Participant connected:', participant.identity, participant.sid)
          addParticipant(participant)
        })
        
        room.on('participantDisconnected', (participant) => {
          console.log('🔴 Participant disconnected:', participant.identity)
          removeParticipant(participant)
        })
        
        room.on('trackPublished', (publication, participant) => {
          console.log('📤 Track published:', {
            kind: publication.kind,
            participant: participant.identity,
            trackSid: publication.trackSid,
            isSubscribed: publication.isSubscribed,
            hasTrack: !!publication.track
          })
          if (publication.isSubscribed && publication.track) {
            addTrack(publication.track, participant)
          }
        })
        
        room.on('trackSubscribed', (track, _, participant) => {
          console.log('✅ Track subscribed:', {
            kind: track.kind,
            participant: participant.identity,
            trackSid: track.sid
          })
          addTrack(track, participant)
        })
        
        room.on('trackUnsubscribed', (track, _, participant) => {
          console.log('❌ Track unsubscribed:', {
            kind: track.kind,
            participant: participant.identity
          })
          removeTrack(track, participant)
        })
        
        room.on('localTrackPublished', (publication) => {
          console.log('📹 Local track published:', {
            kind: publication.kind,
            trackSid: publication.trackSid
          })
        })
        
        room.on('localTrackUnpublished', (publication) => {
          console.log('📵 Local track unpublished:', publication.kind)
        })
        
        // Add error event listener
        room.on('connectionStateChanged', (state) => {
          console.log('Connection state changed:', state)
          setIsConnected(state === 'connected')
        })
        
        room.on('disconnected', (reason) => {
          console.log('Disconnected:', reason)
          setIsConnected(false)
        })

        const protocol = location.protocol === 'https:' ? 'wss://' : 'ws://'
        const url = protocol + location.host
        console.log('Connecting to LiveKit server...')
        
        // LiveKit SDK expects just the base URL, it will append /rtc internally
        await room.connect(url, token)
        console.log('Connected successfully!')
        console.log('Local participant:', room.localParticipant.identity, room.localParticipant.sid)
        console.log('Remote participants count:', room.remoteParticipants.size)
        
        // List all remote participants
        room.remoteParticipants.forEach((p) => {
          console.log('  - Remote participant:', p.identity, p.sid)
          console.log('    Video tracks:', Array.from(p.videoTrackPublications.values()).map(pub => ({
            trackSid: pub.trackSid,
            isSubscribed: pub.isSubscribed,
            hasTrack: !!pub.track
          })))
          console.log('    Audio tracks:', Array.from(p.audioTrackPublications.values()).map(pub => ({
            trackSid: pub.trackSid,
            isSubscribed: pub.isSubscribed,
            hasTrack: !!pub.track
          })))
        })

        // Add existing participants
        room.remoteParticipants.forEach(addParticipant)
        
        // Add local participant
        addParticipant(room.localParticipant)

        // Enable camera and microphone
        try {
          await room.localParticipant.enableCameraAndMicrophone()
          console.log('Camera and microphone enabled')
          setLocalVideoEnabled(true)
        } catch (error) {
          console.error('Failed to enable camera/microphone:', error)
        }
      } catch (error) {
        console.error('Connection error:', error)
      }
    }

    main()
  }, [])

  return (
    <div className="h-screen bg-gray-900 p-4">
      {/* Status bar */}
      <div className="absolute top-4 left-4 z-10 bg-black bg-opacity-50 text-white p-2 rounded">
        <div>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</div>
        <div>Participants: {participantCount}</div>
        <div>Camera: {localVideoEnabled ? '📹 On' : '📷 Off'}</div>
      </div>
      
      {/* Video grid */}
      <div 
        ref={gridRef} 
        className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4 h-full"
      >
        {participantCount === 0 && isConnected && (
          <div className="col-span-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-xl mb-2">Waiting for participants...</p>
              <p className="text-sm">Share the room link for others to join</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App 
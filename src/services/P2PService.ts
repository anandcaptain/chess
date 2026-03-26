'use strict';

import Peer from 'peerjs';

class P2PService {
    constructor() {
        this.peer = null;
    }

    initialize(localPeerId) {
        this.peer = new Peer(localPeerId);
        this.peer.on('open', (id) => {
            console.log('My peer ID is: ' + id);
        });

        this.peer.on('connection', (conn) => {
            this.handleConnection(conn);
        });
    }

    handleConnection(conn) {
        conn.on('data', (data) => {
            console.log('Received', data);
        });

        conn.on('open', () => {
            conn.send('Hello from P2PService!');
        });
    }

    connectToPeer(remotePeerId) {
        const conn = this.peer.connect(remotePeerId);
        this.handleConnection(conn);
    }
}

export default P2PService;
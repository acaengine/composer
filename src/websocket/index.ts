import { mockup } from '../../a2-composer';

export let WebSocket = mockup ?
    require('./mocksocket').MockWebSocket :
    require('./websocket').WebSocketInterface;

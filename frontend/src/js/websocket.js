import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const socketUrl = 'http://localhost:8080/ws';

export function createWebSocketClient({ onPost, onLike, onComment, onCommentLike }) {
      const client = new Client({
            webSocketFactory: () => new SockJS(socketUrl),
            onConnect: () => {
                  if (onPost) client.subscribe('/topic/posts', (msg) => onPost(JSON.parse(msg.body)));
                  if (onLike) client.subscribe('/topic/likes', (msg) => onLike(JSON.parse(msg.body)));
                  if (onComment) client.subscribe('/topic/comments', (msg) => onComment(JSON.parse(msg.body)));
                  if (onCommentLike) client.subscribe('/topic/comment-likes', (msg) => onCommentLike(JSON.parse(msg.body)));
            },
      });
      client.activate();
      return client;
}

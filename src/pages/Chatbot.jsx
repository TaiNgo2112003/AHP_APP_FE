import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Card, Spin, message, Collapse, Space } from 'antd';
import { SendOutlined, DeleteOutlined, RobotOutlined } from '@ant-design/icons';
import axios from 'axios';

const { TextArea } = Input;
const { Panel } = Collapse;

const AIChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey] = useState("AIzaSyAy8qnAJCaNHBx7b2NKXg6R9E8Glr7rlvQ");
  const messagesEndRef = useRef(null);

  // Load messages from sessionStorage on component mount
  useEffect(() => {
    const savedMessages = sessionStorage.getItem('ahp-chat-messages');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  }, []);

  // Save messages to sessionStorage whenever they change
  useEffect(() => {
    sessionStorage.setItem('ahp-chat-messages', JSON.stringify(messages));
  }, [messages]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      text: input,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
        {
          contents: [{
            parts: [{
              text: `Bạn là chuyên gia phân tích AHP (Analytic Hierarchy Process). 
              Hãy trả lời câu hỏi về quyết định lựa chọn địa điểm hoặc phân tích đa tiêu chí.
              Câu hỏi: ${input}`
            }]
          }]
        }
      );

      const aiMessage = {
        text: response.data.candidates[0].content.parts[0].text,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      message.error('Lỗi khi kết nối với AI: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    sessionStorage.removeItem('ahp-chat-messages');
    message.success('Đã xóa lịch sử chat');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <Card
        title={
          <Space>
            <RobotOutlined />
            <span>AI Hỗ Trợ Phân Tích AHP</span>
          </Space>
        }
        extra={
          <Button 
            icon={<DeleteOutlined />} 
            onClick={clearChat}
            danger
          >
            Xóa Cache
          </Button>
        }
      >
        <div style={{ 
          height: '500px', 
          overflowY: 'auto', 
          marginBottom: '20px',
          border: '1px solid #f0f0f0',
          padding: '10px',
          borderRadius: '4px'
        }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
              <p>Chào bạn! Tôi là AI hỗ trợ phân tích AHP.</p>
              <p>Bạn có thể hỏi tôi về:</p>
              <ul style={{ textAlign: 'left', display: 'inline-block' }}>
                <li>Cách xác định tiêu chí đánh giá địa điểm</li>
                <li>Cách thiết lập ma trận so sánh cặp</li>
                <li>Phân tích trọng số các yếu tố</li>
                <li>Đánh giá phương án lựa chọn</li>
              </ul>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div 
                key={index} 
                style={{ 
                  textAlign: msg.sender === 'user' ? 'right' : 'left',
                  margin: '10px 0'
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    padding: '8px 12px',
                    borderRadius: msg.sender === 'user' 
                      ? '12px 12px 0 12px' 
                      : '12px 12px 12px 0',
                    background: msg.sender === 'user' 
                      ? '#1890ff' 
                      : '#f0f0f0',
                    color: msg.sender === 'user' ? '#fff' : '#000',
                    maxWidth: '80%'
                  }}
                >
                  {msg.text}
                  <div style={{ fontSize: '0.8em', opacity: 0.7 }}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <TextArea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Nhập câu hỏi về phân tích AHP..."
            autoSize={{ minRows: 2, maxRows: 4 }}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSendMessage}
            loading={loading}
            disabled={!input.trim()}
          >
            Gửi
          </Button>
        </div>
      </Card>

      <Collapse style={{ marginTop: '20px' }}>
        <Panel header="Gợi ý câu hỏi mẫu" key="1">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <Button 
              type="text" 
              onClick={() => setInput("Các tiêu chí quan trọng khi chọn địa điểm xây dựng trung tâm thương mại là gì?")}
            >
              Tiêu chí chọn địa điểm TTTM
            </Button>
            <Button 
              type="text" 
              onClick={() => setInput("Cách thiết lập ma trận so sánh cặp trong AHP?")}
            >
              Cách lập ma trận AHP
            </Button>
            <Button 
              type="text" 
              onClick={() => setInput("Làm thế nào để tính toán trọng số trong AHP?")}
            >
              Tính trọng số AHP
            </Button>
          </div>
        </Panel>
      </Collapse>
    </div>
  );
};

export default AIChatBox;
import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Card, message, Collapse, Space, Typography, Divider, Spin } from 'antd';
import { SendOutlined, DeleteOutlined, RobotOutlined, BulbOutlined } from '@ant-design/icons';
import api from '../utils/api';

const { TextArea } = Input;
const { Panel } = Collapse;
const { Title, Text } = Typography;

const AIChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [criteriaLoading, setCriteriaLoading] = useState(false);
  const [suggestedCriteria, setSuggestedCriteria] = useState([]);
  const messagesEndRef = useRef(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    try {
      // Thêm tin nhắn người dùng
      const userMsg = { 
        text: input, 
        sender: 'user',
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, userMsg]);
      
      // Gửi API và nhận phản hồi
      const response = await api.chatbox.sendMessage(input);
      const aiMsg = { 
        text: response.response, 
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString()
      };
      
      setMessages(prev => [...prev, aiMsg]);
      setInput('');
    } catch (error) {
      message.error('Gửi tin nhắn thất bại: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCriteriaSuggestions = async () => {
    setCriteriaLoading(true);
    try {
      const response = await api.ahp.getCriteriaSuggestions();
      setSuggestedCriteria(response.criteria);
      message.success('Đã tải gợi ý tiêu chí thành công');
    } catch (error) {
      message.error('Không thể tải gợi ý tiêu chí: ' + error.message);
    } finally {
      setCriteriaLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    message.success('Đã xóa lịch sử trò chuyện');
  };

  return (
    <Card
      title={
        <Space>
          <RobotOutlined style={{ color: '#1890ff' }} />
          <Title level={4} style={{ margin: 0 }}>Trợ lý Phân tích AHP</Title>
        </Space>
      }
      extra={
        <Button 
          icon={<DeleteOutlined />} 
          onClick={clearChat}
          danger
          size="small"
        >
          Xóa chat
        </Button>
      }
      style={{ 
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}
    >
      {/* Khu vực hiển thị tin nhắn */}
      <div 
        style={{ 
          height: '400px', 
          overflowY: 'auto', 
          padding: '16px',
          backgroundColor: '#fafafa',
          borderRadius: '8px',
          marginBottom: '16px'
        }}
      >
        {messages.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 0',
            color: 'rgba(0,0,0,0.45)'
          }}>
            <BulbOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
            <p>Hãy bắt đầu bằng cách đặt câu hỏi về phân tích AHP</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div 
              key={i} 
              style={{ 
                marginBottom: '12px',
                textAlign: msg.sender === 'user' ? 'right' : 'left'
              }}
            >
              <div
                style={{
                  display: 'inline-block',
                  maxWidth: '80%',
                  padding: '8px 16px',
                  borderRadius: msg.sender === 'user' 
                    ? '16px 16px 0 16px' 
                    : '16px 16px 16px 0',
                  backgroundColor: msg.sender === 'user' 
                    ? '#1890ff' 
                    : '#f0f0f0',
                  color: msg.sender === 'user' ? '#fff' : '#000',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                }}
              >
                <Text>{msg.text}</Text>
                <div style={{ 
                  fontSize: '0.75em',
                  opacity: 0.7,
                  marginTop: '4px',
                  textAlign: 'right'
                }}>
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Khu vực nhập tin nhắn */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Nhập câu hỏi về phân tích AHP (tiêu chí, ma trận so sánh, trọng số...)"
          rows={3}
          autoSize={{ minRows: 2, maxRows: 5 }}
          onPressEnter={(e) => {
            if (!e.shiftKey && !loading) {
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
          style={{ height: 'auto' }}
        >
          Gửi
        </Button>
      </div>

      {/* Khu vực gợi ý tiêu chí */}
      <Collapse ghost>
        <Panel 
          header={
            <Space>
              <BulbOutlined />
              <Text strong>Gợi ý tiêu chí AHP</Text>
            </Space>
          } 
          key="1"
        >
          <Spin spinning={criteriaLoading}>
            {suggestedCriteria.length > 0 ? (
              <div style={{ 
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                marginTop: '8px'
              }}>
                {suggestedCriteria.map((criterion, index) => (
                  <Button 
                    key={index}
                    type="dashed"
                    size="small"
                    onClick={() => setInput(`Giải thích về tiêu chí "${criterion}" trong AHP`)}
                  >
                    {criterion}
                  </Button>
                ))}
              </div>
            ) : (
              <Button 
                type="primary" 
                ghost 
                onClick={loadCriteriaSuggestions}
                icon={<BulbOutlined />}
              >
                Lấy gợi ý tiêu chí
              </Button>
            )}
          </Spin>
        </Panel>
      </Collapse>

      {/* Gợi ý câu hỏi mẫu */}
      <Divider orientation="left" plain>Mẫu câu hỏi</Divider>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Button 
          size="small"
          onClick={() => setInput("Cách thiết lập ma trận so sánh cặp trong AHP?")}
        >
          Ma trận so sánh
        </Button>
        <Button 
          size="small"
          onClick={() => setInput("Làm thế nào để tính toán trọng số trong AHP?")}
        >
          Tính trọng số
        </Button>
        <Button 
          size="small"
          onClick={() => setInput("Các tiêu chí quan trọng khi đánh giá địa điểm?")}
        >
          Tiêu chí đánh giá
        </Button>
      </div>
    </Card>
  );
};

export default AIChatBox;
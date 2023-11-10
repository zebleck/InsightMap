import React, { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';

const RecommendationModal = ({ show, onHide, session_id }) => {
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    const eventSource = new EventSource(`http://localhost:5000/request_sse?session_id=${session_id}`);

    eventSource.onmessage = (event) => {
      if (event.data === "__complete__") {
        eventSource.close();
      } else {
        setRecommendations(prevRecommendations => [...prevRecommendations, event.data.replace(/<br>/g, '\n')]);
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [session_id]);

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Recommendations</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {recommendations.map((item, index) => (
          <p key={index}>{item}</p>
        ))}
      </Modal.Body>
    </Modal>
  );
};

export default RecommendationModal;
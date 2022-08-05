import * as React from "react";
import "./MessageInput.scss";

export default function MessageInput(props) {
  const { isLoading, waveMessage, setWaveMessage, wave } = props;
  const handleSubmit = (e) => {
    e.preventDefault();
    if (waveMessage) {
      wave(waveMessage);
    } else {
      alert("please enter some message");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
    >
      <textarea
        className='input'
        disabled={isLoading}
        value={waveMessage}
        onChange={(e) => setWaveMessage(e.currentTarget.value)}
      ></textarea>
      <button disabled={isLoading} className='waveButton' type='submit'>
        Wave at Me
      </button>
    </form>
  );
}

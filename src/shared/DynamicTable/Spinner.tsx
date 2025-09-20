const Spinner: React.FC = () => (
  <div
    style={{
      display: "inline-block",
      width: "20px",
      height: "20px",
      border: "2px solid #f3f3f3",
      borderTop: "2px solid #007bff",
      borderRadius: "50%",
      animation: "spin 1s linear infinite",
    }}
  >
    <style>
      {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
    </style>
  </div>
);
export default Spinner;

import React, { useEffect, useState } from "react";
import {
  IonContent,
  IonPage,
  IonItem,
  IonLabel,
  IonInput,
  IonButton,
  IonText,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonSpinner,
  IonToast,
} from "@ionic/react";
import { Link, useHistory } from "react-router-dom";
import { useAuth } from "../../hooks/AuthHooks";
import { LoginRequestSchema } from "../../schema/auth.schema";
import { z } from "zod";
import "./Login.css";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const { signIn } = useAuth();
  const history = useHistory();

  const validateForm = (): boolean => {
    try {
      LoginRequestSchema.parse({ email, password });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: { [key: string]: string } = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const res = await signIn.mutateAsync({ email, password });
      if(!!res.user) {
         history.push("/app/dashboard");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      setToastMessage(message);
      setShowToast(true);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Sign In</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="login-content">
        <div className="login-container">
          <div className="login-header">
            <h1>Welcome to StudyHub</h1>
            <p>Sign in to access your account</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <IonItem className={errors.email ? "ion-invalid" : ""}>
              <IonLabel position="stacked">Email</IonLabel>
              <IonInput
                type="email"
                value={email}
                placeholder="Enter your email"
                onIonInput={(e) => setEmail(e.detail.value!)}
                required
              />
            </IonItem>
            {errors.email && (
              <IonText color="danger" className="error-text">
                {errors.email}
              </IonText>
            )}

            <IonItem className={errors.password ? "ion-invalid" : ""}>
              <IonLabel position="stacked">Password</IonLabel>
              <IonInput
                type="password"
                value={password}
                placeholder="Enter your password"
                onIonInput={(e) => setPassword(e.detail.value!)}
                required
              />
            </IonItem>
            {errors.password && (
              <IonText color="danger" className="error-text">
                {errors.password}
              </IonText>
            )}

            <IonButton
              expand="block"
              type="submit"
              disabled={signIn.isPending}
              className="login-button"
            >
              {signIn.isPending ? (
                <>
                  <IonSpinner name="crescent" />
                  <span style={{ marginLeft: "8px" }}>Signing in...</span>
                </>
              ) : (
                "Sign In"
              )}
            </IonButton>
          </form>

          <div className="login-footer">
            <p>
              Don't have an account?{" "}
              <Link to="/register" className="register-link">
                Sign up here
              </Link>
            </p>
          </div>
        </div>

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          color="danger"
        />
      </IonContent>
    </IonPage>
  );
};

export default Login;

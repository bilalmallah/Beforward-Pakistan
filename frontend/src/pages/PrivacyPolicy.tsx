import React from "react";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="privacy-page">
      <div className="privacy-container">
        <header className="privacy-header">
          <h1>Privacy Policy</h1>
          <p className="updated">Last updated: August 19, 2026</p>
        </header>

        <main className="privacy-content">
          <p>
            This Privacy Policy explains how BeForward Pakistan ("we", "us",
            or "our") collects, uses, stores, and protects information when
            using our customer communication and management platform,
            including services provided through WhatsApp Business Platform.
          </p>

          <section>
            <h2>1. Information We Collect</h2>

            <p>
              Depending on how you interact with our services, we may collect
              and process the following information:
            </p>

            <ul>
              <li>Customer name</li>
              <li>Phone number</li>
              <li>Email address</li>
              <li>Country and business information</li>
              <li>WhatsApp conversations and messages</li>
              <li>Customer communication history</li>
              <li>Lead and customer status information</li>
              <li>Information provided during customer communication</li>
            </ul>
          </section>

          <section>
            <h2>2. How We Use Information</h2>

            <p>We may use collected information to:</p>

            <ul>
              <li>Communicate with customers and business contacts</li>
              <li>Respond to inquiries and requests</li>
              <li>Manage customer and lead records</li>
              <li>Maintain conversation history</li>
              <li>Provide customer support</li>
              <li>Manage sales activities and follow-ups</li>
              <li>Improve our communication and customer service</li>
              <li>Maintain the security and reliability of our platform</li>
            </ul>
          </section>

          <section>
            <h2>3. WhatsApp Communications</h2>

            <p>
              Our platform may use the WhatsApp Business Platform provided by
              Meta to send and receive business communications.
            </p>

            <p>
              WhatsApp messages and related communication information may be
              processed through Meta's services in accordance with Meta's
              applicable terms and policies.
            </p>
          </section>

          <section>
            <h2>4. Customer Conversations</h2>

            <p>
              When a customer communicates with us through WhatsApp or another
              supported communication channel, the conversation may be stored
              in our customer relationship management system so authorized
              members of our sales and support teams can manage the
              conversation and provide appropriate assistance.
            </p>
          </section>

          <section>
            <h2>5. Information Sharing</h2>

            <p>
              We do not sell customer personal information.
            </p>

            <p>
              Information may be shared with service providers and technology
              platforms that are necessary to operate our communication
              services, including WhatsApp Business Platform and other
              infrastructure providers used by our application.
            </p>
          </section>

          <section>
            <h2>6. Data Security</h2>

            <p>
              We use reasonable technical and organizational measures to
              protect information against unauthorized access, alteration,
              disclosure, or destruction.
            </p>

            <p>
              Access to customer information within our platform is limited to
              authorized users based on their assigned responsibilities.
            </p>
          </section>

          <section>
            <h2>7. Data Retention</h2>

            <p>
              We retain customer and conversation information only for as long
              as reasonably necessary for business, customer service,
              operational, legal, and security purposes.
            </p>
          </section>

          <section>
            <h2>8. Your Choices and Rights</h2>

            <p>
              Depending on applicable law, you may have rights regarding your
              personal information, including requesting access, correction,
              or deletion of your information.
            </p>

            <p>
              You may also request that we stop sending certain types of
              communications where applicable.
            </p>
          </section>

          <section>
            <h2>9. Third-Party Services</h2>

            <p>
              Our platform may use third-party services to provide messaging,
              hosting, analytics, authentication, and other infrastructure
              functionality.
            </p>

            <p>
              These services may process information according to their own
              privacy policies and applicable agreements.
            </p>
          </section>

          <section>
            <h2>10. Children's Privacy</h2>

            <p>
              Our services are intended for business and general customer
              communication and are not directed toward children.
            </p>
          </section>

          <section>
            <h2>11. Changes to This Privacy Policy</h2>

            <p>
              We may update this Privacy Policy from time to time. Any changes
              will be published on this page with an updated revision date.
            </p>
          </section>

          <section>
            <h2>12. Contact Us</h2>

            <p>
              If you have questions about this Privacy Policy or wish to
              request information about your personal data, please contact us.
            </p>

            <div className="contact-box">
              <p>
                <strong>BeForward Pakistan</strong>
              </p>
              <p>
                Email: bilal@tealclimate.com
              </p>
            </div>
          </section>
        </main>

        <footer className="privacy-footer">
          © 2026 BeForward Pakistan. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
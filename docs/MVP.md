# MVP Plan: FSL Lens

## 1. Product Summary

**FSL Lens** is a web app that identifies static Filipino Sign Language signs using a camera.

For the MVP, the app will focus only on:

* Filipino Sign Language alphabet
* Filipino Sign Language numbers 0–10
* Static hand signs only
* Real-time browser-based recognition
* Learning and practice support

The goal is not to translate full FSL conversations yet. The MVP is a learning and checking tool for people practicing FSL alphabet and numbers.

---

## 2. MVP Goal

The MVP should allow users to open the web app, turn on their webcam, perform a static FSL alphabet or number sign, and receive a prediction with confidence and helpful feedback.

### Main Success Goal

Users should be able to reliably practice FSL alphabet and numbers, and the app should give useful feedback when signs are unclear or wrong.

---

## 3. Target Users

### Primary Users

1. Deaf / hard-of-hearing Filipinos
2. Hearing people learning Filipino Sign Language

### Initial Release Audience

The first release should be a **private test** with selected Deaf/FSL users, FSL teachers/interpreters, and beginner learners.

---

## 4. MVP Scope

### Included in MVP

* Web app
* Webcam-based recognition
* Static FSL alphabet recognition
* Static FSL number recognition from 0–10
* Free Recognition Mode
* Practice Mode
* Learn Library
* Reference image per sign
* Confidence score
* Top 3 possible predictions
* “Unknown” state for low confidence
* Correction tips
* Hand landmark overlay
* Internal dataset capture tool
* Simple admin dashboard
* Supabase database
* Model version tracking
* Feedback collection

### Excluded from MVP

* Dynamic signs
* Full words or sentences
* Sentence translation
* User accounts
* Progress tracking
* Mobile app
* Offline installed app
* Voice/audio by default
* Public launch

---

## 5. Platform and Tech Stack

### App Platform

**Web app first**

Primary device:

* Laptop / desktop webcam

Secondary device:

* Mobile browser

### Recommended Stack

* **Frontend:** Next.js
* **Language:** TypeScript
* **Styling:** Tailwind CSS
* **Database/backend:** Supabase Postgres
* **Camera/landmarks:** MediaPipe Hands
* **Training:** Python scripts or notebooks
* **Initial classifiers:** kNN / Random Forest
* **Possible later classifier:** small neural network
* **Model execution:** browser-based inference

---

## 6. Recognition Approach

### Initial Recognition Method

Use **MediaPipe Hands** to detect hand landmarks.

The first model should use:

* 21 hand landmarks per hand
* x/y/z coordinate data
* Hand count
* Handedness
* Normalized landmark positions

### Model Input Approach

Start with:

> Hand landmarks only

Future enhancement:

> Hybrid model using hand landmarks + cropped hand image if landmark-only recognition is not accurate enough.

---

## 7. One-Hand and Two-Hand Support

The MVP should support both:

* One-hand signs
* Two-hand signs

Each sign in the database must include:

* Expected hand count
* Sign type: alphabet or number
* Label
* Reference image
* Instruction
* Common mistakes

Recognition flow:

1. Detect hand count
2. If one hand is detected, use one-hand classifier
3. If two hands are detected, use two-hand classifier
4. If expected hand count does not match, show guidance

---

## 8. Prediction Behavior

### Confidence Rules

Starting configuration:

* **80% and above:** confirm prediction
* **60%–79%:** show top 3 suggestions, but do not confirm
* **Below 60%:** show “Unknown”

These values should be adjustable during testing.

### Stability Rule

A sign should only be confirmed after:

> 5 consecutive valid frames with the same prediction

This should also be adjustable during testing.

### Unclear Sign Behavior

When unclear, the app should show:

* “Unknown”
* Top 3 possible predictions
* Simple correction tip
* Prompt to hold hand steady
* Prompt to adjust hand position if needed

---

## 9. Main User Modes

### A. Free Recognition Mode

User opens camera and signs freely.

The app shows:

* Live camera feed
* Optional hand landmark overlay
* Predicted sign
* Confidence score
* Top 3 predictions if uncertain
* Correction tip
* “No hand detected” message when needed

Good for quick testing and exploration.

---

### B. Practice Mode

Practice Mode has two sub-modes:

#### 1. Guided Practice

Flow:

1. User chooses a letter or number
2. App shows reference image and instruction
3. User performs the sign
4. User clicks “Check Sign” or uses real-time hints
5. App confirms correct or gives correction feedback

#### 2. Random Quiz

Flow:

1. App randomly selects a letter or number
2. User performs the sign
3. App checks the sign
4. App shows result, reference image, and correction tip
5. User tries again or moves to next sign

---

### C. Learn Library

The Learn Library should contain all MVP signs.

Navigation:

* Alphabet tab
* Numbers tab
* Search

Each sign page/card should include:

* Display name
* Reference image
* Expected hand count
* Short instruction
* Common mistake / correction tip

---

## 10. Main MVP Pages

### 1. Home Page

Purpose:

* Explain what FSL Lens does
* Let user choose a mode

Main actions:

* Start Recognition
* Practice
* Learn Signs

---

### 2. Recognize Page

Purpose:

* Real-time sign identification

Features:

* Camera permission explanation
* Start Camera button
* Live webcam feed
* Landmark overlay toggle
* Mirror mode toggle
* Prediction result
* Confidence score
* Top 3 suggestions
* Feedback buttons: Correct / Wrong

---

### 3. Practice Page

Purpose:

* Help users learn and check signs

Features:

* Guided practice
* Random quiz
* Reference image
* Check Sign button
* Result panel
* Correction tip
* Try Again button

---

### 4. Learn Library Page

Purpose:

* Let users browse signs

Features:

* Alphabet tab
* Numbers tab
* Search
* Reference image per sign
* Instruction
* Common mistake

---

### 5. Dataset Capture Page

Internal-only page.

Purpose:

* Collect training samples

Features:

* Select sign label
* Show expected hand count
* Start camera
* Show landmarks
* Capture landmark samples
* Reject bad samples
* Mark low-quality samples
* Optional raw image capture with consent

---

### 6. Admin Page

Simple internal admin page.

Purpose:

* Review and manage data

Features:

* View samples
* Filter by sign
* Review low-quality samples
* View feedback
* View model versions
* Export dataset

---

## 11. Camera UX

### Camera Permission Flow

Do not ask for camera access immediately.

Recommended flow:

1. Show short explanation:

   > FSL Lens uses your camera to detect hand landmarks in your browser.

2. User clicks **Start Camera**

3. Browser asks for camera permission

### Camera Display

Default:

* Mirrored camera preview
* Hand landmark overlay on
* Bounding box on

User controls:

* Toggle overlay on/off
* Toggle mirror mode on/off

### No Hand Detected State

Show:

> Place your hand inside the camera frame.

Also show a simple guide frame.

### Hand Too Close or Too Far

Show messages like:

* Move your hand closer
* Move your hand farther from the camera
* Keep your hand inside the guide frame
* Hold your hand steady

---

## 12. Dataset Plan

### Dataset Collection Method

Build an internal dataset capture tool.

Flow:

1. Contributor opens capture page
2. Selects sign label
3. Reads instruction/reference
4. Performs sign
5. App captures landmarks
6. App validates sample quality
7. Sample is saved to Supabase

### Dataset Size Target

Initial target:

* 200–300 landmark samples per sign

Prototype contributors:

* 3–5 people

MVP testing contributors:

* 10–20 people

### Sign Coverage

MVP signs:

* Alphabet A–Z
* Numbers 0–10

Approximate total:

* 26 alphabet signs
* 11 number signs
* **37 signs total**

At 200–300 samples per sign:

* Minimum target: 7,400 samples
* Better target: 11,100 samples

---

## 13. Sample Quality Rules

A sample should only be saved for training when:

* Correct hand count is detected
* All required landmarks are visible
* MediaPipe detector confidence is at least 80%
* Hand is inside the ideal camera area
* Hand is not too close or too far
* Sign is held steady

### Bad Sample Handling

* Reject clearly bad samples
* Save borderline samples as low quality
* Allow admin review before training inclusion

---

## 14. Data Storage Plan

Use **Supabase Postgres**.

### Main Tables

* `signs`
* `samples`
* `feedback`
* `dataset_versions`
* `model_versions`

---

## 15. Recommended Table Structure

### `signs`

Stores sign information and learning content.

Fields:

* `id`
* `label`
* `display_name`
* `type`
* `expected_hand_count`
* `reference_image_url`
* `short_instruction`
* `common_mistakes`
* `is_active`

Example labels:

* `alphabet_A`
* `alphabet_B`
* `number_0`
* `number_1`

---

### `samples`

Stores collected landmark samples.

Fields:

* `id`
* `sign_id`
* `session_id`
* `landmarks_json`
* `hand_count`
* `handedness`
* `detector_confidence`
* `camera_type`
* `lighting_note`
* `quality_status`
* `review_status`
* `consent_raw_image`
* `raw_image_url`
* `created_at`

---

### `feedback`

Stores user feedback after predictions.

Fields:

* `id`
* `session_id`
* `predicted_sign_id`
* `expected_sign_id`
* `confidence`
* `top_predictions_json`
* `was_correct`
* `sample_id`
* `created_at`

---

### `dataset_versions`

Stores dataset snapshots used for training.

Fields:

* `id`
* `version_name`
* `sample_count`
* `included_signs`
* `split_config`
* `created_at`
* `notes`

---

### `model_versions`

Stores trained model versions.

Fields:

* `id`
* `version_name`
* `dataset_version_id`
* `model_type`
* `model_file_url`
* `accuracy`
* `per_sign_accuracy_json`
* `confusion_matrix_json`
* `threshold_config_json`
* `status`
* `created_at`
* `notes`

Model status options:

* `draft`
* `testing`
* `active`
* `archived`

---

## 16. Privacy and Consent

### Default Privacy Behavior

* Do not upload camera frames by default
* Do not save raw camera photos from normal users
* Recognition should run in the browser
* Save only feedback and landmarks when consent is given

### Dataset Collection Consent

For controlled dataset collection:

* Ask consent once per session
* Show active “Data collection is on” indicator
* Allow optional raw image saving only with explicit consent
* Prefer landmarks over raw images

### Identity

For MVP:

* Use anonymous session ID
* No user accounts

Later:

* Optional accounts for progress tracking and contributor management

---

## 17. Model Training Plan

### Training Process

1. Export reviewed dataset from Supabase
2. Normalize landmarks
3. Train classifier in Python
4. Evaluate model
5. Export model for browser use
6. Register model version in Supabase
7. Test in browser
8. Mark best model as active

### Normalization

Start with:

* Normalize landmarks relative to wrist
* Scale by hand size

Later test:

* Rotation/orientation normalization if needed

### Dataset Splitting

Use multiple split types:

1. Random split for quick experiments
2. Signer-based split for real MVP validation

Signer-based split is more important because it tests whether the model works on new people.

### Evaluation Metrics

Track:

* Overall accuracy
* Per-sign accuracy
* Confusion pairs
* Average confidence
* Time to stable prediction
* Low-confidence frequency
* Real-time browser performance

### MVP-Ready Model Criteria

The model is MVP-ready only if:

* Offline testing is acceptable
* Per-sign accuracy is acceptable
* Confusion pairs are understood
* Browser real-time testing works smoothly
* Selected users find the feedback useful

---

## 18. Model Export Strategy

Export depends on the best classifier.

### If kNN Is Used

Export:

* Normalized landmark vectors
* Labels
* Classifier config
* Threshold config

Format:

* JSON

### If Random Forest Is Used

Export options:

* Convert model logic to browser-compatible format
* Or use a JS-compatible ML library

### If Neural Network Is Used

Export:

* TensorFlow.js model

---

## 19. Feedback Loop

After prediction, users can submit feedback:

* Correct
* Wrong
* Optional expected answer
* Optional consent to save landmark sample

This helps identify:

* Confusing signs
* Weak signs
* Camera or lighting issues
* Signs that need more training data

---

## 20. Reference Image Plan

For each sign:

* Start with consented photos from an FSL signer
* Use these for accuracy and validation
* Later convert to clean illustrations or vector-style hand guides

Do not rely only on random public images because sign accuracy and variation matter.

---

## 21. Development Milestones

### Milestone 1: Project Setup

Deliverables:

* Next.js app
* Tailwind setup
* Supabase setup
* Basic page routes
* Environment variables
* Initial UI layout

Pages:

* Home
* Recognize
* Practice
* Learn
* Dataset Capture
* Admin

---

### Milestone 2: Camera and Hand Tracking

Deliverables:

* Start Camera button
* Camera permission flow
* MediaPipe Hands integration
* Hand landmark overlay
* Bounding box
* Mirror toggle
* Overlay toggle
* No-hand message
* Hand position guide

---

### Milestone 3: Sign Database and Learn Library

Deliverables:

* `signs` table
* Seed alphabet and numbers 0–10
* Learn Library UI
* Alphabet and Numbers tabs
* Search
* Sign detail/card view

---

### Milestone 4: Dataset Capture Tool

Deliverables:

* Select sign label
* Show reference image/instruction
* Capture landmark sample
* Store sample in Supabase
* Validate hand count
* Validate detector confidence
* Mark quality status
* Consent flow for controlled dataset collection

---

### Milestone 5: Dataset Export and Training Script

Deliverables:

* Export JSON landmark dataset
* Export CSV summary
* Python training script
* Landmark normalization
* kNN / Random Forest experiment
* Evaluation report
* Confusion matrix
* Model export

---

### Milestone 6: Browser Prediction

Deliverables:

* Load active model
* Run prediction from camera landmarks
* Apply threshold rules
* Apply stable-frame rule
* Show prediction, confidence, top 3
* Show Unknown when confidence is low
* Show correction tips

---

### Milestone 7: Practice Mode

Deliverables:

* Guided Practice
* Random Quiz
* Check Sign button
* Correct/wrong result
* Reference image
* Correction tip
* Try Again button

---

### Milestone 8: Feedback and Admin

Deliverables:

* Correct/Wrong feedback buttons
* Optional expected answer
* Optional sample submission
* Admin sample viewer
* Feedback viewer
* Model version viewer
* Dataset export button

---

### Milestone 9: Private Testing

Deliverables:

* Private test link
* Testing guide
* Selected tester group
* Accuracy report
* Confusion-pair report
* UX feedback summary
* Retraining plan

---

## 22. MVP Acceptance Criteria

The MVP is acceptable when:

* User can open the app in a browser
* User can start webcam recognition
* App detects one-hand and two-hand landmarks
* App recognizes alphabet and numbers 0–10
* App shows confidence score
* App shows Unknown for low confidence
* App shows top 3 suggestions for uncertain signs
* App confirms prediction only after stable frames
* User can practice a selected sign
* User can take a random quiz
* Learn Library displays all MVP signs
* Dataset capture tool can save clean samples
* Admin can review samples and model versions
* Recognition runs in the browser
* Camera frames are not uploaded by default

---

## 23. Suggested Build Order

Build in this order:

1. Next.js project setup
2. Supabase schema
3. Camera + MediaPipe hand landmarks
4. Learn Library
5. Dataset capture tool
6. Collect first dataset
7. Train first classifier
8. Browser prediction
9. Practice Mode
10. Feedback system
11. Admin dashboard
12. Private test
13. Improve weak signs
14. Retrain model
15. Prepare public beta later

---

## 24. Future Roadmap After MVP

### Phase 2

* Add more static words
* Add user accounts
* Add progress tracking
* Add saved practice history
* Improve mobile browser support
* Improve reference illustrations

### Phase 3

* Add dynamic signs
* Use sequence-based models
* Track hand movement over time
* Add facial/body cues if needed
* Support short phrases

### Phase 4

* Mobile app
* Offline installed version
* Teacher dashboard
* Class practice mode
* Community dataset contribution

---

## 25. Recommended Immediate Next Step

Start with the **technical foundation**:

> Build a Next.js prototype that opens the webcam, runs MediaPipe Hands, displays landmarks, and captures landmark samples into Supabase.

That should be the first working version because the model depends on collecting clean training data.

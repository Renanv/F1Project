app-title = F1 Project
home = Home
login = Login
register = Register
logout = Logout

welcome-message = Welcome!
login-title = Login
username-label = Username
password-label = Password
login-button = Log In

login-success = Successfully logged in!
login-prompt = Please log in to continue.

driver-rankings-title = Driver Rankings
view-driver-rankings = View Driver Rankings

driver-name = Driver
driver-number = #
driver-table-score = LSF-Score
driver-position = Position

upload-race-data = Upload Race Data
select-file = Please select a file to upload.

team-configurations-title = Team Configurations
save-configurations-button = Save Configurations
race-points-config-title = Race Points Configuration

toggle-locale-pt = Português
toggle-locale-en = English 

# Register Page Additions
register-title = Register
confirm-password-label = Confirm Password
register-button = Register
login-link = Already have an account? Log in here.

usertag-label = User Tag (Gamer Tag)
driver-number-label = Driver Number

driver-number-checking = Checking availability...
driver-number-available = Driver number is available!

validation-check-failed = Could not verify driver number. Please try again.

# Driver Score Display
driver-score-value = { $score } pts

# Driver Points Display
driver-table-points = Points

# Driver Team Display
driver-team = Team

# Admin Section Titles & Links
admin-championship-manager-title = Championship & Race Manager
admin-team-manager-title = Team & User Assignment Manager 

# Race Selection for Upload
select-race-label = Race
select-race-placeholder = Select Race for Upload...

# Championship Manager
admin-championships-heading = Championships
admin-add-championship-subheading = Add New Championship
admin-new-championship-label = Championship Name
admin-create-championship-button = Create Championship
admin-no-championships = No championships found.
admin-races-heading = Races for { $champName }
admin-race-date-label = Date: { $raceDate }
admin-no-races = No races found for this championship.
admin-add-race-subheading = Add New Race
admin-new-race-title-label = Race Title
admin-new-race-date-label = Race Date
admin-add-race-button = Add Race to { $champName }
admin-select-championship-prompt = Select a championship to view and add races.

# Team Manager
admin-teams-heading = Teams
admin-no-teams = No teams found.
admin-add-team-subheading = Add New Team
admin-new-team-label = Team Name
admin-create-team-button = Create Team
admin-assign-users-heading = Assign Users to Team

# Team Manager - Assignment Section
admin-select-championship-label = Championship 
admin-select-championship-placeholder = Select Championship... 
admin-available-users-subheading = Available Users (Not in this Championship)
admin-assigned-users-subheading = Users Assigned to { $teamName }
admin-no-available-users = No users available to assign. 
admin-no-assigned-users = No users assigned to this team in this championship. 
admin-select-champ-team-prompt = Select a championship and team to manage assignments. 

# Team Manager - Assignment Buttons/Errors
admin-assign-button = Assign
admin-unassign-button = Unassign

# Admin Panel
admin-panel-link = Admin
admin-link-championships = Championships
admin-desc-championships = Manage championships and races.
admin-link-teams = Teams
admin-desc-teams = Manage teams and user assignments.
admin-link-config = Configuration
admin-desc-config = Adjust application settings.

# Championship Manager Edit/Delete Modals
admin-edit-championship-title = Edit Championship
admin-delete-championship-title = Delete Championship
admin-delete-championship-confirm = Are you sure you want to delete the championship "{ $champName }"? This will also delete all associated races and results.
admin-edit-race-title = Edit Race
admin-delete-race-title = Delete Race
admin-delete-race-confirm = Are you sure you want to delete the race "{ $raceTitle }"? This will also delete all results logged for this race.
admin-cancel-button = Cancel
admin-save-button = Save
admin-delete-button = Delete

# Team Manager Edit/Delete Modals
admin-edit-team-title = Edit Team 
admin-delete-team-title = Delete Team 
admin-delete-team-confirm = Are you sure you want to delete the team "{ $teamName }"? Any users assigned to this team will be unassigned. 

# Navigation
account-link = Account 

# Driver Rankings
no-drivers-found = No drivers found for this race/championship.

# Admin Config
admin-config-title = Configuration

# Account Page
account-page-title = Manage Your Account
account-details-heading = Your Details
account-change-password-heading = Change Password
account-save-details-button = Save Details
account-current-password-label = Current Password
account-new-password-label = New Password
account-change-password-button = Change Password
fetch-user-data-error-auth = Authentication failed. Could not load user data. Please log in again.
fetch-user-data-error-network = Network error. Could not connect to server to fetch account details. Please check your connection.
fetch-user-data-error-setup = Request setup error. Could not fetch account details.
fetch-user-data-error = Could not fetch your account details. Please try refreshing the page.
validation-check-failed = Driver number validation failed. Please try again.
account-no-changes = No changes detected.
account-details-updated = Account details updated successfully.
account-update-details-error = Failed to update account details.
account-password-fields-required = All password fields are required.
account-password-updated = Password updated successfully.
account-update-password-error = Failed to update password.
driver-number-invalid-or-taken = Driver number is invalid or already taken.
account-incorrect-current-password = Incorrect current password.
password-too-short = Password must be at least 6 characters.

invalid-driver-number-format = Invalid driver number format.

# Driver Rankings Page Specific
select-championship-label = Championship
no-championships-available = No Championships Available
team-name-not-available = Unassigned
fetch-championships-error = Error loading championships list.
fetch-rankings-error = Error loading rankings for the selected championship.

# Home Page / Dashboard
dashboard-title = Dashboard
login-or-register-prompt = Please log in or register to access your dashboard.

# Generic Errors / Messages
login-failed-generic = Login failed. Please check username and password.
fill-all-fields = Please fill in all required fields.

# Config Page
loading-config = Loading configurations...
fetch-config-error = Error fetching configurations.
save-config-partial-error = Some configuration updates failed. Please check logs or try again.
save-config-error = Error saving configurations.
save-config-success = Configurations saved successfully.

# Championship/Race Manager Page Errors
fetch-championships-error = Error fetching championships list.
fetch-races-error = Error fetching races for the selected championship.
create-championship-error = Error creating championship. Please try again.
create-race-error = Error creating race. Please try again.
edit-championship-error = Error saving championship changes.
delete-championship-error = Error deleting championship.
edit-race-error = Error saving race changes.
delete-race-error = Error deleting race.
select-champ-placeholder = Please select a championship first.

# Team Manager Page Errors / Placeholders
fetch-teams-error = Error fetching teams list.
fetch-users-error = Error fetching users list.
fetch-attendees-error = Error fetching championship attendees.
create-team-error = Error creating team.
error-assigning-user = Error assigning user to team.
error-unassigning-user = Error unassigning user from team.
edit-team-error = Error saving team changes.
delete-team-error = Error deleting team.
admin-select-team-prompt = Please select a team to manage assignments.

# Generic / Fallbacks
generic-error-fallback = An unexpected error occurred. Please try again.
race-date-not-set = Date not set
selected-team-label = Selected Team

# PWA / Install
install-app-button = Install App

# My Status Card Section
my-status-title = My Status
no-championships-for-status = No championship data available to display status.
my-current-standing = My Current Standing
team-label = Team
not-ranked = Not Ranked
points-label = Points
teammate-points-label = Teammate(s) Points
last-race-result-title = Last Race: { $raceName }
race-event-label = Race
race-date-label = Date
position-label = Position
fastest-lap-label = Fastest Lap
select-championship-label = Select Championship
please-select-championship-status = Please select a championship to view your status.

# src/components/admin/ChampionshipManager.js
admin-attendees-heading = Attendees
admin-no-attendees = No attendees found for this championship.
admin-remove-attendee-title = Remove Attendee
admin-remove-attendee-confirm = Are you sure you want to remove { $userName } from the championship "{ $champName }"? Their score and points will be reset for this championship.
admin-remove-button = Remove
remove-attendee-error = Error removing attendee.

# LSF Score Reveal Race Admin
admin-lsf-score-reveal-race-label = LSF Score Display Point
admin-lsf-score-reveal-race-live-option = Show Current Live Score

# Bonus Points System (Admin)
admin-add-bonus-points-title = Add Bonus/Penalty Points for { $userName }
admin-bonus-points-amount-label = Points Amount (can be negative)
admin-bonus-points-source-label = Source
admin-bonus-points-reason-label = Reason (Optional)
admin-submit-bonus-points-button = Submit Points
bonus-points-missing-fields = Error: Points amount and source are required.
bonus-points-invalid-amount = Error: Points amount must be a valid number.
add-bonus-points-error = Error: Could not add bonus points. Please try again.
add-bonus-points-success = Bonus points added successfully for { $userName }.

# Bonus Points Log (Admin)
admin-bonus-points-log-title = Bonus Points Log for { $userName }
fetch-bonus-log-error = Error: Could not fetch bonus points log.
admin-no-bonus-log-entries = No bonus point entries found for this attendee.
bonus-log-points-header = Points
bonus-log-source-header = Source
bonus-log-reason-header = Reason
bonus-log-awarded-at-header = Date Awarded
admin-close-button = Close

# Bonus Point Sources
bonus-source-MANUAL_ADJUSTMENT = Manual Adjustment
# bonus-source-PENALTY_APPEAL_WON = Penalty Appeal Won (Removed)
# bonus-source-SPORTING_CONDUCT_AWARD = Sporting Conduct Award (Removed)
bonus-source-RACE_INCIDENT_PENALTY = Race Incident Penalty
bonus-source-BEAUTIFUL_PLAY = Beautiful Play
bonus-source-OTHER = Other (Specify in Reason)
bonus-source-CLASH = Clash
bonus-source-FASTEST_LAP = Fastest Lap
bonus-source-DRIVER_OF_THE_DAY = Driver of the Day

# Home Page - My Status Card
bonus-points-label = Bonus Points

# Rankings Page
rankings-page-title = Rankings
ranking-type-driver = Drivers
ranking-type-team = Teams
ranking-type-constructors = Constructors

# Team Rankings
fetch-team-rankings-error = Error fetching team rankings.
no-team-rankings-found = No team rankings found for this championship.
team-position = Rank
team-name = Team
team-total-points = Total Points

# Constructors (Score) Rankings
no-drivers-for-constructors = No driver data available to generate constructors ranking.
no-drivers-in-tier = No drivers in this tier for the selected championship.

# Generic
no-data-for-ranking = No data available for the selected ranking type.

# LSF Score Reveal Message
# lsf-score-reveal-message = LSF Scores displayed are as of { $raceTitle }.

# Admin LSF Score Reveal Race
admin-lsf-score-reveal-race-label = LSF Score Display Point
admin-lsf-score-reveal-race-live-option = Show Current Score (Live)
no-participated-championships = No participated championships found

clear-cache-reload = Clear Cache and Reload

# Community Page
community-page-link = Channels & Videos
community-page-title = Channels & Videos
community-page-description = Share your Twitch or YouTube channel, or a video of a great moment.
community-tab-channels = Channels
community-tab-videos = Videos

# Submission Form
submission-form-title = Submit Your Content
submission-type-label = Content Type
submission-type-channel = Channel
submission-type-video = Video
submission-url-label = YouTube or Twitch URL
submission-category-label = Video Category
submission-category-live = Live Stream Highlight
submission-category-switchback = Switchback (X)
submission-category-double-overtake = Double Overtake
submission-category-triple-overtake = Triple Overtake
submission-submit-button = Submit
submission-success-message = Your content has been submitted for review!
submission-error-message = There was an error submitting your content. Please try again.
submission-error-url = Please enter a valid YouTube or Twitch URL.

# Submission Card
submission-status-pending = Pending Review
submission-status-approved = Approved
submission-status-rejected = Rejected
submission-type-label = Type: { $type }
submission-status-label = Status: { $status }
submission-reviewed-by-label = Reviewed by { $name }
submission-approve-button = Approve
submission-reject-button = Reject

# Filter Toggles
filter-all = All
filter-pending = Pending
filter-approved = Approved
filter-rejected = Rejected


# System de Penalidades
penalties-list-title = Penalties List
submit-new-penalty-button = Submit New Penalty
filter-by-championship-label = Filter by Championship
all-championships-option = All Championships
penalty-header-id = ID
penalty-header-race = Race
penalty-header-submitted-by = Submitted By
penalty-header-accused = Accused
penalty-header-status = Status
penalty-header-submitted-at = Submitted At
penalty-header-actions = Actions
view-details-button = View Details

# Penalty Statuses (also used in getStatusChip)
penalty-status-pending-review = Pending Review
penalty-status-under-jury-review = Under Jury Review
penalty-status-awaiting-final-decision = Awaiting Final Decision
penalty-status-closed-approved = Closed - Approved
penalty-status-closed-rejected = Closed - Rejected
penalty-status-closed-no-action = Closed - No Action

# Penalty Submission Form
penalty-submission-form-title = Submit Penalty Review
championship-label = Championship
select-championship-placeholder = Select Championship
race-label = Race
select-race-placeholder = Select Race
accused-user-label = User to be Reviewed
select-accused-user-placeholder = Select User
video-link-label = Video Link (YouTube, Twitch, etc.)
video-timestamp-label = Video Timestamp (Optional, e.g., 1m23s)
considerations-label = Considerations (Describe the incident)
submit-penalty-button = Submit Penalty
penalty-submission-success = Penalty submitted successfully!
penalty-submission-error = Error submitting penalty.
fetch-championships-error = Error fetching championships.
fetch-races-error = Error fetching races.
fetch-drivers-error = Error fetching drivers for review.

# Penalty Detail Page
penalty-detail-title = Penalty Details # { $penaltyId }
fetch-penalty-detail-error = Error loading penalty details.
penalty-detail-forbidden = You do not have permission to view this penalty.
penalty-detail-not-found = Penalty submission not found.
penalty-detail-no-data = No details available for this penalty.
back-to-list-button = Back to List

penalty-general-info = General Information
penalty-submitted-by = Submitted By
penalty-accused-user = Accused User
penalty-submitted-at = Submitted At
penalty-evidence = Evidence & Description
video-timestamp-label = Video Timestamp
penalty-current-status = Current Status
penalty-jury-assignments = Jury Panel

# Jury Assignment & Judgment Statuses
jury-judgment-status-pending-judgment = Pending Judgment
jury-judgment-status-judgment-submitted = Judgment Submitted

no-jury-assigned = No jury has been assigned to this penalty yet.
penalty-judgments-title = Jury Judgments
judgment-reason-label = Reason

penalty-final-outcome = Final Outcome
final-outcome-decision = Decision
final-outcome-reason = Reason
outcome-not-specified = Not Specified

# Admin Actions on Penalty Detail Page
admin-actions-header = Admin Actions
admin-final-decision-title = Make Final Decision
new-penalty-status-label = New Status
final-outcome-label = Final Outcome
final-reason-label = Final Reason (Optional)
submit-decision-button = Submit Decision
assign-jury-title = Assign Jury Panel
juror-c1-label = Juror C1
juror-c2-label = Juror C2
juror-c3-label = Juror C3
select-juror-placeholder = Select a Juror
assign-jury-button = Assign/Update Jury
admin-or-divider = OR
assign-jury-race-wide-note = Note: Assigning a jury here will apply to all applicable penalties submitted for this race.

# Juror Display Fallbacks (for non-admin view of panel list)
juror-slot-display-c1 = Juror C1
juror-slot-display-c2 = Juror C2
juror-slot-display-c3 = Juror C3
anonymous-juror-display = Anonymous Juror (C2)
judgment-slot-c3-popular-vote = Popular Vote (C3)

# Judgment Options (used in Detail and Submission Form)
judgment-option-sp = Stop and Go Penalty (SP)
judgment-option-l = Light Penalty (L)
judgment-option-m = Medium Penalty (M)
judgment-option-g = Grid Penalty (G)
judgment-option-no-action = No Action Warranted
judgment-option-no-penalty = No Penalty

# My Jury Tasks Page
my-jury-tasks-title = My Jury Tasks
assigned-penalty-id = Penalty ID
assigned-championship = Championship
assigned-race = Race
assigned-accused = Accused User
juror-slot-header = Your Slot
assigned-submission-time = Submitted At
view-and-judge-button = View & Judge
no-jury-tasks-found = No pending jury tasks found for you.
fetch-jury-tasks-error = Error fetching your assigned jury tasks.

# Admin Penalty Manager Page
admin-penalty-manager-title = Manage Penalties (Admin)
filter-by-status-label = Filter by Status
all-statuses-option = All Statuses
assigned-jurors-count-header = Jurors
judgments-submitted-count-header = Judgments In
manage-penalty-button = View/Manage
fetch-admin-penalties-error = Error fetching penalties for admin view.

# Submit Judgment Form (New Strings)
submit-judgment-title = Submit Your Judgment (Slot: { $assignedSlot }) for { $userTag }
judgment-label = Judgment
select-judgment-placeholder = Select a Judgment...
submit-judgment-button = Submit Judgment
your-turn-to-judge-chip = Your Turn!

# User Status Card
user-status-card-no-championship-selected = Please select a championship to view your status.
user-status-card-loading = Loading status...
user-status-card-error = Could not load status for this championship.
user-status-card-not-participant = You are not a participant in this championship.
user-status-card-rank-label = Rank
user-status-card-points-label = Total Points
user-status-card-bonus-points-label = Bonus Points
user-status-card-team-label = Team
user-status-card-teammate-points-label = Teammate Points
user-status-card-last-race-title = Last Race ({ $raceName })
user-status-card-position-label = Position
user-status-card-fastest-lap-label = Fastest Lap
user-status-card-overall-fastest-lap-chip = Overall Fastest!
user-status-card-no-last-race = No race results recorded in this championship yet.
user-status-card-view-bonus-log-button = View Bonus Log

# Navigation / Dashboard Link for Penalties
penalties-list-link = Penalty System

# Table Pagination
pagination-rows-per-page = Rows per page:
pagination-displayed-rows = { $from }–{ $to } of { $count }
pagination-displayed-rows-of-more-than = { $from }–{ $to } of more than { $count }
no-championships-for-penalties = No championships available to show penalties.
fetch-penalties-error = Error fetching penalties for this championship.
no-penalties-found-for-championship = No penalties found for the selected championship.
back-button = Go Back

# Penalty List Page - New Header
penalty-header-final-outcome = Final Outcome

admin-bonus-points-amount-label = Points Amount (can be negative)
admin-bonus-points-reason-label = Reason (Optional)
admin-bonus-points-source-label = Source
admin-submit-bonus-points-button = Submit Points
championship-name-required = Championship name is required
fetch-admin-penalties-error = Error fetching penalties.
fetch-admin-races-error = Error loading races
filter-all-championships = All Championships (Select One)
filter-by-status = Filter by Status
filters-label = Filters
loading-races-message = Loading races...
my-jury-tasks-title = My Pending Jury Tasks
no-championships-for-penalties = No championships available to show penalties.
no-pending-jury-tasks = You have no pending jury tasks at the moment.
no-penalties-found-filters = No penalties found matching the current filters.
no-penalties-found-for-championship = No penalties found for the selected championship.
no-users-for-championship = No users found for this championship
penalty-header-jurors = Jurors Assigned
penalty-header-judgments = Judgments In
race-title-date-required = Race title and date are required
select-team-label = Select Team
submit-judgment-title = Submit Your Judgment
submit-your-judgment-link = Submit Your Judgment
view-and-judge-button = View & Judge

# Account Page File Uploads
account-driver-picture-heading = Driver Picture
account-select-driver-picture-button = Select Picture
account-upload-driver-picture-button = Upload Picture
select-driver-picture-first = Please select a driver picture file first.
driver-picture-uploaded = Driver picture uploaded successfully.
driver-picture-upload-error = Failed to upload driver picture.

account-payment-confirmation-heading = Payment Confirmation
account-current-payment-confirmation-label = Current Confirmation:
account-view-payment-confirmation-link = View File
account-select-payment-confirmation-button = Select File
account-upload-payment-confirmation-button = Upload File
select-payment-confirmation-first = Please select a payment confirmation file first.
payment-confirmation-uploaded = Payment confirmation uploaded successfully.
payment-confirmation-upload-error = Failed to upload payment confirmation.
fetch-payment-link-error = Could not load payment confirmation link.

# Admin Uploaded Files Overview
admin-uploaded-files-title = Uploaded Files Overview
fetch-uploaded-files-error = Error fetching uploaded files.
admin-driver-pictures-heading = Driver Pictures
admin-no-driver-pictures = No driver pictures found.
admin-payment-confirmations-heading = Payment Confirmations
admin-no-payment-confirmations = No payment confirmations found.
admin-view-payment-confirmation-link = View Confirmation
admin-uploaded-files-nav-link = Uploaded Files
admin-desc-uploaded-files = Review and manage user-uploaded driver pictures and payment confirmations.

# Password Recovery
register-success-title = Registration Successful!
recovery-codes-warning = Please save these recovery codes in a safe place. You will not be able to see them again. These are the only way to recover your account if you lose your password.
copy-codes-button = Copy Codes
proceed-to-login-button = I have saved my codes. Proceed to Login.
forgot-password-link = Forgot Password?
reset-password-title = Reset Password
recovery-code-label = Recovery Code
verify-code-button = Verify Code
new-password-label = New Password
confirm-new-password-label = Confirm New Password
reset-password-button = Reset Password
verify-code-failed = Failed to verify recovery code. Please check your username and code.
password-reset-success = Your password has been reset successfully. You will be redirected to the login page.
password-reset-failed = Failed to reset password. Please try again.
password-mismatch = Passwords do not match.
register-link = Don't have an account? Sign Up

# Account Page - Recovery Codes
account-recovery-codes-heading = Account Recovery
account-has-active-codes = You have active, unused recovery codes. Keep them safe.
account-no-active-codes-prompt = You do not have any active recovery codes. Generate a set now to protect your account.
generate-recovery-codes-button = Generate New Recovery Codes
recovery-codes-generated-success = New codes generated successfully! Please save them in a safe place.
recovery-codes-save-warning = Please save these new codes in a safe place. You will not be able to see them again.
recovery-codes-done-button = I have saved my codes
account-has-active-codes-prompt = You have active, unused recovery codes. You can generate a new set, but this will invalidate all of your old codes.

# Account Page - Recovery Codes
account-recovery-codes-heading = Account Recovery
account-has-active-codes = You have active, unused recovery codes. Keep them safe.
account-no-active-codes-prompt = You do not have any active recovery codes. Generating new codes will invalidate any old ones you might have saved.
generate-recovery-codes-button = Generate New Recovery Codes
recovery-codes-generated-success = New recovery codes generated successfully. Please save them in a safe place.
generate-codes-error = An error occurred while generating new recovery codes. Please try again.

# --- Team Rankings ---
team-rankings-title = Team Rankings
team-rankings-header-position = Pos
team-rankings-header-team = Team
team-rankings-header-points = Points

# --- Clashes View ---
rankings-clashes-tab = Clashes
clashes-select-race = Select a race to view clashes
clashes-no-race-selected = Please select a race to see the clash results.
clashes-no-matchups-configured = Clash matchups have not been configured for this championship yet.
clashes-loading-error = An error occurred while loading the clash data.
clashes-qualy = Qualy
clashes-fastest-lap = Fastest Lap
clashes-race-finish = Race Finish
clashes-select-driver = Select Driver
clashes-save-button = Save
clashes-save-success = Clash result saved successfully.
clashes-save-error = An error occurred while saving the clash result.

# --- Clash Matchup Configurator ---
clashes-config-title = Configure Clash Matchups
clashes-config-instructions = Define the 10 fixed team matchups for this championship. This configuration will apply to all races within this championship.
clashes-config-load-teams-error = Failed to load teams for configuration.
clashes-config-all-fields-required = All 10 matchups must be fully configured with two teams each.
clashes-config-teams-must-be-different = A team cannot be matched against itself.
clashes-config-save-error = An error occurred while saving the matchups.
clashes-config-save-button = Save Matchups

# --- Penalties ---
penalties-page-title = Penalties
penalties-list-title = Submitted Penalties
submit-penalty-title = Submit Penalty
select-accused-user-label = Accused User

# --- Penalty Details ---
penalty-details-title = Penalty Details
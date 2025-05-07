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
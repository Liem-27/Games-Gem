# Requirements Document

## Introduction

Gemoria: Crystal Quest is an original HTML5 match-3 puzzle game with a fantasy crystal visual theme. This specification covers **Phase 1 only**: the project foundation and the main menu. Phase 1 establishes a clean, modular architecture (HTML5, CSS3, Vanilla JavaScript ES modules, no framework) that later phases can extend without rework, and delivers a responsive, touch-friendly main menu with fully wired navigation buttons and original placeholder artwork.

Phase 1 explicitly excludes gameplay systems: the match-3 board, match detection, special gems, obstacles, levels, boosters logic, sound, animation, and save/persistence. Those are deferred to later phases.

All visual identity in this project is original. No copyrighted assets, user interface layouts, characters, branding, sounds, or artwork from any existing commercial match-3 product are copied or imitated.

## Glossary

- **Gemoria_Game**: The overall HTML5 match-3 game application titled "Gemoria: Crystal Quest".
- **Main_Menu**: The primary landing screen presented when the game loads, containing the game title and the navigation buttons.
- **Menu_Button**: An interactive control on the Main_Menu. The five Menu_Buttons are Play, World Map, Boosters, Achievements, and Settings.
- **Placeholder_Screen**: A minimal destination view shown when a Menu_Button is activated, indicating the corresponding feature is not yet implemented (a "coming-soon" state), with a means to return to the Main_Menu.
- **Router**: The JavaScript module responsible for switching the visible screen between the Main_Menu and Placeholder_Screens.
- **UI_Module**: A JavaScript ES module responsible for rendering and updating a specific portion of the user interface.
- **Placeholder_Artwork**: Original graphics created for this project using inline SVG or CSS, used in place of any external or copyrighted image assets.
- **Touch_Target**: The activatable area of a Menu_Button, measured in CSS pixels.
- **Viewport**: The visible area of the browser window in which the Gemoria_Game is rendered.
- **ES_Module**: A JavaScript file using the ECMAScript module system (import/export).
- **Developer**: A person who sets up, runs, or extends the Gemoria_Game codebase.
- **Player**: A person who interacts with the Gemoria_Game through a web browser.

## Requirements

### Requirement 1: Modular Project Structure

**User Story:** As a Developer, I want a clean modular project structure, so that later phases can add gameplay systems without reworking the foundation.

#### Acceptance Criteria

1. THE Gemoria_Game SHALL organize source files into at least three distinct directories, with at least one directory dedicated to markup files, at least one dedicated to style files, and at least one dedicated to script files, such that no directory contains files of more than one of these three categories.
2. THE Gemoria_Game SHALL provide exactly one HTML entry point named index.html located at the project root directory, and index.html SHALL reference the entry-point ES_Module.
3. THE Gemoria_Game SHALL implement each JavaScript file as an ES_Module that exposes its functionality through at least one export statement.
4. THE Gemoria_Game SHALL ensure each ES_Module exposes exactly one primary functional concern, such that all export statements within a single ES_Module relate to that one concern.
5. THE Gemoria_Game SHALL separate CSS into at least two files, where each CSS file contains style rules for exactly one functional concern.
6. WHERE a future gameplay system (board, match detection, special gems, obstacles, levels, boosters, sound, animation, or save system) is added in a later phase, THE Gemoria_Game project structure SHALL accommodate the new ES_Module without requiring modification of the Main_Menu ES_Modules.

### Requirement 2: HTML Entry Point

**User Story:** As a Player, I want the game to load from a single web page, so that I can start the game by opening one file in a browser.

#### Acceptance Criteria

1. WHEN index.html finishes parsing and its module scripts complete initial execution in a browser that supports ES_Modules, THE Gemoria_Game SHALL render the Main_Menu within the Viewport within 2 seconds.
2. THE index.html SHALL reference the JavaScript entry point using a single script element whose type attribute is set to module.
3. THE index.html SHALL reference each required CSS file, comprising the base and reset styles file, the fantasy crystal theme file, and the Main_Menu layout and Menu_Button styling file.
4. WHILE index.html is being parsed and until the Main_Menu has completed its initial render, THE Gemoria_Game SHALL produce zero browser console error entries.
5. IF the JavaScript entry point script fails to load or fails to execute, THEN THE Gemoria_Game SHALL display an on-screen message indicating that the game failed to load, and SHALL not leave the Viewport blank.

### Requirement 3: Modular CSS

**User Story:** As a Developer, I want CSS split by responsibility, so that styles remain maintainable as the game grows.

#### Acceptance Criteria

1. THE Gemoria_Game SHALL provide a separate CSS file dedicated to base and reset styles that contains no theme-specific color or typography definitions.
2. THE Gemoria_Game SHALL provide a separate CSS file dedicated to the fantasy crystal visual theme that defines at least one color value and at least one typography property (font family, size, or weight).
3. THE Gemoria_Game SHALL provide a separate CSS file dedicated to Main_Menu layout and Menu_Button styling that contains no base, reset, or theme color definitions.
4. THE Gemoria_Game SHALL define every fantasy crystal theme color as a reusable CSS custom property, such that no color value in the theme, menu, or base CSS files is hardcoded as a literal.
5. WHERE a Menu_Button or Main_Menu element applies a fantasy crystal theme color, THE Gemoria_Game SHALL reference the corresponding CSS custom property rather than a literal color value.
6. IF a referenced CSS custom property is undefined at render time, THEN THE Gemoria_Game SHALL apply a defined fallback color value so that the element remains visible against its background.

### Requirement 4: Modular JavaScript

**User Story:** As a Developer, I want JavaScript organized into single-responsibility ES modules, so that future systems integrate cleanly.

#### Acceptance Criteria

1. THE Gemoria_Game SHALL provide exactly one ES_Module serving as the application entry point that initializes the Gemoria_Game.
2. THE Gemoria_Game SHALL provide a Router ES_Module that is solely responsible for switching the visible screen, exposing a single operation that accepts a target screen identifier and updates the visible screen to the identified target.
3. IF the Router ES_Module receives a target screen identifier that does not match a defined screen, THEN THE Gemoria_Game SHALL leave the currently visible screen unchanged and produce an indication that the requested screen was not found.
4. THE Gemoria_Game SHALL provide a separate UI_Module, distinct from the entry point ES_Module and the Router ES_Module, that is solely responsible for rendering the Main_Menu.
5. WHEN the entry point ES_Module runs, THE Gemoria_Game SHALL render the Main_Menu through the Main_Menu UI_Module within 2 seconds of the entry point ES_Module starting.

### Requirement 5: Game Title Display

**User Story:** As a Player, I want to see the game title on the main menu, so that I know which game I am playing.

#### Acceptance Criteria

1. WHEN the Main_Menu is rendered, THE Gemoria_Game SHALL display the text "Gemoria: Crystal Quest" as the title within 500 milliseconds of the Main_Menu becoming active.
2. WHILE the Main_Menu is displayed, THE Gemoria_Game SHALL render the complete title text fully contained within the visible bounds of the Viewport, with no portion of the title clipped or positioned outside the Viewport.
3. WHILE the Main_Menu is displayed, THE Gemoria_Game SHALL keep the title continuously visible with no interruption until the Main_Menu is dismissed or transitions to another screen.
4. IF the title text cannot be rendered within the Viewport bounds, THEN THE Gemoria_Game SHALL resize or reposition the title so that the complete text remains fully contained within the Viewport.

### Requirement 6: Main Menu Navigation Buttons

**User Story:** As a Player, I want main menu buttons for the game's sections, so that I can navigate to each feature area.

#### Acceptance Criteria

1. WHEN the Main_Menu is rendered, THE Gemoria_Game SHALL display exactly five Menu_Buttons labeled Play, World Map, Boosters, Achievements, and Settings.
2. WHEN a Player activates a Menu_Button, THE Router SHALL display the Placeholder_Screen associated with that activated Menu_Button within 500 milliseconds.
3. IF a Player activates a Menu_Button while a Placeholder_Screen is already displayed, THEN THE Router SHALL replace the currently displayed Placeholder_Screen with the Placeholder_Screen associated with the activated Menu_Button.
4. WHEN a Placeholder_Screen is displayed, THE Gemoria_Game SHALL display a text message indicating that the associated feature is not yet available.
5. WHEN a Placeholder_Screen is displayed, THE Gemoria_Game SHALL display a control that, when activated by the Player, returns the Player to the Main_Menu within 500 milliseconds.
6. WHEN a Player activates a Menu_Button, THE Gemoria_Game SHALL display a visual state change on the activated Menu_Button within 100 milliseconds of activation.

### Requirement 7: Placeholder Artwork

**User Story:** As a Player, I want appealing original artwork on the menu, so that the game feels polished without relying on copyrighted assets.

#### Acceptance Criteria

1. WHEN the menu is displayed, THE Gemoria_Game SHALL render Placeholder_Artwork using only inline SVG or CSS, without referencing any external image files.
2. THE Gemoria_Game SHALL render all menu graphics using Placeholder_Artwork rather than external image files.
3. THE Placeholder_Artwork SHALL present a fantasy crystal visual theme containing at least one crystal or gem shape.
4. IF any Placeholder_Artwork asset fails to render, THEN THE Gemoria_Game SHALL display the menu with a solid-color background fallback and SHALL keep all menu controls interactive.
5. WHEN the menu is displayed, THE Gemoria_Game SHALL complete rendering of all Placeholder_Artwork within 1000 milliseconds.

### Requirement 8: Responsive and Mobile-Friendly Layout

**User Story:** As a Player, I want the menu to work on both desktop and mobile, so that I can play on any device.

#### Acceptance Criteria

1. WHILE the Viewport width is 768 CSS pixels or less, THE Gemoria_Game SHALL arrange the Menu_Buttons in a single vertical column with each Menu_Button occupying the full available Viewport width minus a horizontal margin of 16 CSS pixels on each side.
2. WHILE the Viewport width is greater than 768 CSS pixels, THE Gemoria_Game SHALL arrange the Main_Menu content horizontally centered within the Viewport with a maximum content width of 960 CSS pixels.
3. THE Gemoria_Game SHALL render each Touch_Target with a minimum height of 44 CSS pixels and a minimum width of 44 CSS pixels, and SHALL maintain a minimum spacing of 8 CSS pixels between adjacent Touch_Targets.
4. THE index.html SHALL declare a viewport meta element with content setting width equal to the device width and initial scale equal to 1.0.
5. WHILE the Viewport is resized to any width between 320 CSS pixels and 2560 CSS pixels, THE Gemoria_Game SHALL keep the Main_Menu content within the Viewport with zero horizontal overflow such that no horizontal scrollbar appears.
6. IF the Main_Menu content height exceeds the Viewport height, THEN THE Gemoria_Game SHALL enable vertical scrolling while keeping horizontal overflow at zero.

### Requirement 9: Phase 1 Scope Boundary

**User Story:** As a Developer, I want Phase 1 limited to the foundation and menu, so that scope stays controlled and later phases build on a stable base.

#### Acceptance Criteria

1. THE Gemoria_Game SHALL exclude the match-3 board from Phase 1, such that no board grid is rendered and no gameplay board component is instantiated during Phase 1 execution.
2. THE Gemoria_Game SHALL exclude all of the following systems from Phase 1: match detection, special gems, obstacles, levels, boosters logic, sound, animation, and save system, such that none of these systems is initialized, invoked, or reachable through any Phase 1 interaction.
3. WHERE a Menu_Button corresponds to a deferred gameplay feature, WHEN the Menu_Button is activated, THE Gemoria_Game SHALL display a Placeholder_Screen within 500 milliseconds and SHALL NOT invoke any deferred gameplay system.
4. IF an attempt is made to invoke a deferred gameplay system during Phase 1, THEN THE Gemoria_Game SHALL block the invocation, retain the current menu state, and display a message indicating the feature is not available in Phase 1.
5. WHEN the Placeholder_Screen is displayed, THE Gemoria_Game SHALL provide a control that returns the user to the originating menu and SHALL restore the prior menu state.

### Requirement 10: Correctness and Run Instructions

**User Story:** As a Developer, I want the project to run cleanly with clear instructions, so that I can verify Phase 1 locally.

#### Acceptance Criteria

1. WHEN the Gemoria_Game is loaded in a browser that supports ES_Modules, THE Gemoria_Game SHALL load all JavaScript without producing any syntax errors or uncaught exceptions in the browser console.
2. IF a syntax error or uncaught exception occurs during loading, THEN THE Gemoria_Game SHALL surface an error indication in the browser console identifying the failure.
3. WHEN the Main_Menu is loaded, THE Gemoria_Game SHALL render every Menu_Button in an enabled, activatable state.
4. WHEN a Menu_Button is activated, THE Gemoria_Game SHALL respond within 200 milliseconds by performing the action associated with that Menu_Button.
5. THE Gemoria_Game SHALL provide written run instructions that specify the exact command or steps to serve the project locally over HTTP.
6. THE Gemoria_Game SHALL state in the written run instructions that ES_Modules require serving over HTTP and that opening index.html directly from the file system is not supported.

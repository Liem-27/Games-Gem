# Requirements Document

## Introduction

SnoopsGem : Crystal is an original HTML5 match-3 puzzle game with a fantasy crystal visual theme. This specification covers **Phase 1 only**: the project foundation and the main menu. Phase 1 establishes a clean, modular architecture (HTML5, CSS3, Vanilla JavaScript ES modules, no framework) that later phases can extend without rework, and delivers a responsive, touch-friendly main menu with fully wired navigation buttons and original placeholder artwork.

Phase 1 explicitly excludes gameplay systems: the match-3 board, match detection, special gems, obstacles, levels, boosters logic, sound, animation, and save/persistence. Those are deferred to later phases.

All visual identity in this project is original. No copyrighted assets, user interface layouts, characters, branding, sounds, or artwork from any existing commercial match-3 product are copied or imitated.

## Glossary

- **SnoopsGem_Game**: The overall HTML5 match-3 game application titled "SnoopsGem : Crystal".
- **Main_Menu**: The primary landing screen presented when the game loads, containing the game title and the navigation buttons.
- **Menu_Button**: An interactive control on the Main_Menu. The five Menu_Buttons are Play, World Map, Boosters, Achievements, and Settings.
- **Placeholder_Screen**: A minimal destination view shown when a Menu_Button is activated, indicating the corresponding feature is not yet implemented (a "coming-soon" state), with a means to return to the Main_Menu.
- **Router**: The JavaScript module responsible for switching the visible screen between the Main_Menu and Placeholder_Screens.
- **UI_Module**: A JavaScript ES module responsible for rendering and updating a specific portion of the user interface.
- **Placeholder_Artwork**: Original graphics created for this project using inline SVG or CSS, used in place of any external or copyrighted image assets.
- **Touch_Target**: The activatable area of a Menu_Button, measured in CSS pixels.
- **Viewport**: The visible area of the browser window in which the SnoopsGem_Game is rendered.
- **ES_Module**: A JavaScript file using the ECMAScript module system (import/export).
- **Developer**: A person who sets up, runs, or extends the SnoopsGem_Game codebase.
- **Player**: A person who interacts with the SnoopsGem_Game through a web browser.

## Requirements

### Requirement 1: Modular Project Structure

**User Story:** As a Developer, I want a clean modular project structure, so that later phases can add gameplay systems without reworking the foundation.

#### Acceptance Criteria

1. THE SnoopsGem_Game SHALL organize source files into at least three distinct directories, with at least one directory dedicated to markup files, at least one dedicated to style files, and at least one dedicated to script files, such that no directory contains files of more than one of these three categories.
2. THE SnoopsGem_Game SHALL provide exactly one HTML entry point named index.html located at the project root directory, and index.html SHALL reference the entry-point ES_Module.
3. THE SnoopsGem_Game SHALL implement each JavaScript file as an ES_Module that exposes its functionality through at least one export statement.
4. THE SnoopsGem_Game SHALL ensure each ES_Module exposes exactly one primary functional concern, such that all export statements within a single ES_Module relate to that one concern.
5. THE SnoopsGem_Game SHALL separate CSS into at least two files, where each CSS file contains style rules for exactly one functional concern.
6. WHERE a future gameplay system (board, match detection, special gems, obstacles, levels, boosters, sound, animation, or save system) is added in a later phase, THE SnoopsGem_Game project structure SHALL accommodate the new ES_Module without requiring modification of the Main_Menu ES_Modules.

### Requirement 2: HTML Entry Point

**User Story:** As a Player, I want the game to load from a single web page, so that I can start the game by opening one file in a browser.

#### Acceptance Criteria

1. WHEN index.html finishes parsing and its module scripts complete initial execution in a browser that supports ES_Modules, THE SnoopsGem_Game SHALL render the Main_Menu within the Viewport within 2 seconds.
2. THE index.html SHALL reference the JavaScript entry point using a single script element whose type attribute is set to module.
3. THE index.html SHALL reference each required CSS file, comprising the base and reset styles file, the fantasy crystal theme file, and the Main_Menu layout and Menu_Button styling file.
4. WHILE index.html is being parsed and until the Main_Menu has completed its initial render, THE SnoopsGem_Game SHALL produce zero browser console error entries.
5. IF the JavaScript entry point script fails to load or fails to execute, THEN THE SnoopsGem_Game SHALL display an on-screen message indicating that the game failed to load, and SHALL not leave the Viewport blank.

### Requirement 3: Modular CSS

**User Story:** As a Developer, I want CSS split by responsibility, so that styles remain maintainable as the game grows.

#### Acceptance Criteria

1. THE SnoopsGem_Game SHALL provide a separate CSS file dedicated to base and reset styles that contains no theme-specific color or typography definitions.
2. THE SnoopsGem_Game SHALL provide a separate CSS file dedicated to the fantasy crystal visual theme that defines at least one color value and at least one typography property (font family, size, or weight).
3. THE SnoopsGem_Game SHALL provide a separate CSS file dedicated to Main_Menu layout and Menu_Button styling that contains no base, reset, or theme color definitions.
4. THE SnoopsGem_Game SHALL define every fantasy crystal theme color as a reusable CSS custom property, such that no color value in the theme, menu, or base CSS files is hardcoded as a literal.
5. WHERE a Menu_Button or Main_Menu element applies a fantasy crystal theme color, THE SnoopsGem_Game SHALL reference the corresponding CSS custom property rather than a literal color value.
6. IF a referenced CSS custom property is undefined at render time, THEN THE SnoopsGem_Game SHALL apply a defined fallback color value so that the element remains visible against its background.

### Requirement 4: Modular JavaScript

**User Story:** As a Developer, I want JavaScript organized into single-responsibility ES modules, so that future systems integrate cleanly.

#### Acceptance Criteria

1. THE SnoopsGem_Game SHALL provide exactly one ES_Module serving as the application entry point that initializes the SnoopsGem_Game.
2. THE SnoopsGem_Game SHALL provide a Router ES_Module that is solely responsible for switching the visible screen, exposing a single operation that accepts a target screen identifier and updates the visible screen to the identified target.
3. IF the Router ES_Module receives a target screen identifier that does not match a defined screen, THEN THE SnoopsGem_Game SHALL leave the currently visible screen unchanged and produce an indication that the requested screen was not found.
4. THE SnoopsGem_Game SHALL provide a separate UI_Module, distinct from the entry point ES_Module and the Router ES_Module, that is solely responsible for rendering the Main_Menu.
5. WHEN the entry point ES_Module runs, THE SnoopsGem_Game SHALL render the Main_Menu through the Main_Menu UI_Module within 2 seconds of the entry point ES_Module starting.

### Requirement 5: Game Title Display

**User Story:** As a Player, I want to see the game title on the main menu, so that I know which game I am playing.

#### Acceptance Criteria

1. WHEN the Main_Menu is rendered, THE SnoopsGem_Game SHALL display the text "SnoopsGem : Crystal" as the title within 500 milliseconds of the Main_Menu becoming active.
2. WHILE the Main_Menu is displayed, THE SnoopsGem_Game SHALL render the complete title text fully contained within the visible bounds of the Viewport, with no portion of the title clipped or positioned outside the Viewport.
3. WHILE the Main_Menu is displayed, THE SnoopsGem_Game SHALL keep the title continuously visible with no interruption until the Main_Menu is dismissed or transitions to another screen.
4. IF the title text cannot be rendered within the Viewport bounds, THEN THE SnoopsGem_Game SHALL resize or reposition the title so that the complete text remains fully contained within the Viewport.

### Requirement 6: Main Menu Navigation Buttons

**User Story:** As a Player, I want main menu buttons for the game's sections, so that I can navigate to each feature area.

#### Acceptance Criteria

1. WHEN the Main_Menu is rendered, THE SnoopsGem_Game SHALL display exactly five Menu_Buttons labeled Play, World Map, Boosters, Achievements, and Settings.
2. WHEN a Player activates a Menu_Button, THE Router SHALL display the Placeholder_Screen associated with that activated Menu_Button within 500 milliseconds.
3. IF a Player activates a Menu_Button while a Placeholder_Screen is already displayed, THEN THE Router SHALL replace the currently displayed Placeholder_Screen with the Placeholder_Screen associated with the activated Menu_Button.
4. WHEN a Placeholder_Screen is displayed, THE SnoopsGem_Game SHALL display a text message indicating that the associated feature is not yet available.
5. WHEN a Placeholder_Screen is displayed, THE SnoopsGem_Game SHALL display a control that, when activated by the Player, returns the Player to the Main_Menu within 500 milliseconds.
6. WHEN a Player activates a Menu_Button, THE SnoopsGem_Game SHALL display a visual state change on the activated Menu_Button within 100 milliseconds of activation.

### Requirement 7: Placeholder Artwork

**User Story:** As a Player, I want appealing original artwork on the menu, so that the game feels polished without relying on copyrighted assets.

#### Acceptance Criteria

1. WHEN the menu is displayed, THE SnoopsGem_Game SHALL render Placeholder_Artwork using only inline SVG or CSS, without referencing any external image files.
2. THE SnoopsGem_Game SHALL render all menu graphics using Placeholder_Artwork rather than external image files.
3. THE Placeholder_Artwork SHALL present a fantasy crystal visual theme containing at least one crystal or gem shape.
4. IF any Placeholder_Artwork asset fails to render, THEN THE SnoopsGem_Game SHALL display the menu with a solid-color background fallback and SHALL keep all menu controls interactive.
5. WHEN the menu is displayed, THE SnoopsGem_Game SHALL complete rendering of all Placeholder_Artwork within 1000 milliseconds.

### Requirement 8: Responsive and Mobile-Friendly Layout

**User Story:** As a Player, I want the menu to work on both desktop and mobile, so that I can play on any device.

#### Acceptance Criteria

1. WHILE the Viewport width is 768 CSS pixels or less, THE SnoopsGem_Game SHALL arrange the Menu_Buttons in a single vertical column with each Menu_Button occupying the full available Viewport width minus a horizontal margin of 16 CSS pixels on each side.
2. WHILE the Viewport width is greater than 768 CSS pixels, THE SnoopsGem_Game SHALL arrange the Main_Menu content horizontally centered within the Viewport with a maximum content width of 960 CSS pixels.
3. THE SnoopsGem_Game SHALL render each Touch_Target with a minimum height of 44 CSS pixels and a minimum width of 44 CSS pixels, and SHALL maintain a minimum spacing of 8 CSS pixels between adjacent Touch_Targets.
4. THE index.html SHALL declare a viewport meta element with content setting width equal to the device width and initial scale equal to 1.0.
5. WHILE the Viewport is resized to any width between 320 CSS pixels and 2560 CSS pixels, THE SnoopsGem_Game SHALL keep the Main_Menu content within the Viewport with zero horizontal overflow such that no horizontal scrollbar appears.
6. IF the Main_Menu content height exceeds the Viewport height, THEN THE SnoopsGem_Game SHALL enable vertical scrolling while keeping horizontal overflow at zero.

### Requirement 9: Phase 1 Scope Boundary

**User Story:** As a Developer, I want Phase 1 limited to the foundation and menu, so that scope stays controlled and later phases build on a stable base.

#### Acceptance Criteria

1. THE SnoopsGem_Game SHALL exclude the match-3 board from Phase 1, such that no board grid is rendered and no gameplay board component is instantiated during Phase 1 execution.
2. THE SnoopsGem_Game SHALL exclude all of the following systems from Phase 1: match detection, special gems, obstacles, levels, boosters logic, sound, animation, and save system, such that none of these systems is initialized, invoked, or reachable through any Phase 1 interaction.
3. WHERE a Menu_Button corresponds to a deferred gameplay feature, WHEN the Menu_Button is activated, THE SnoopsGem_Game SHALL display a Placeholder_Screen within 500 milliseconds and SHALL NOT invoke any deferred gameplay system.
4. IF an attempt is made to invoke a deferred gameplay system during Phase 1, THEN THE SnoopsGem_Game SHALL block the invocation, retain the current menu state, and display a message indicating the feature is not available in Phase 1.
5. WHEN the Placeholder_Screen is displayed, THE SnoopsGem_Game SHALL provide a control that returns the user to the originating menu and SHALL restore the prior menu state.

### Requirement 10: Correctness and Run Instructions

**User Story:** As a Developer, I want the project to run cleanly with clear instructions, so that I can verify Phase 1 locally.

#### Acceptance Criteria

1. WHEN the SnoopsGem_Game is loaded in a browser that supports ES_Modules, THE SnoopsGem_Game SHALL load all JavaScript without producing any syntax errors or uncaught exceptions in the browser console.
2. IF a syntax error or uncaught exception occurs during loading, THEN THE SnoopsGem_Game SHALL surface an error indication in the browser console identifying the failure.
3. WHEN the Main_Menu is loaded, THE SnoopsGem_Game SHALL render every Menu_Button in an enabled, activatable state.
4. WHEN a Menu_Button is activated, THE SnoopsGem_Game SHALL respond within 200 milliseconds by performing the action associated with that Menu_Button.
5. THE SnoopsGem_Game SHALL provide written run instructions that specify the exact command or steps to serve the project locally over HTTP.
6. THE SnoopsGem_Game SHALL state in the written run instructions that ES_Modules require serving over HTTP and that opening index.html directly from the file system is not supported.

---

## Phase 2 Introduction: Core Match-3 Gameplay

Phase 2 adds the core match-3 gameplay to SnoopsGem : Crystal, building on the Phase 1 foundation (modular ES-module architecture, Router, Main_Menu, Placeholder_Screens, and Game_State). Phase 2 delivers a playable 8x8 board with six gem types, gem selection and swapping, match detection, gem removal, gravity, refill, and automatic cascade resolution, playable with both mouse and touch on desktop and mobile.

Phase 2 preserves the existing Phase 1 architecture. The Router, Main_Menu navigation, and Placeholder_Screens continue to function unchanged. The Play Menu_Button, which previously routed to a Placeholder_Screen, now routes to the interactive Game_Board_Screen. Gameplay logic is added as new focused ES_Modules (for example board, gem, match, screens/game-board, and animation only where required), each retaining a single primary responsibility, without modifying the Main_Menu ES_Modules.

Phase 2 keeps board configuration data-driven where practical (board dimensions and gem type set are defined as data, not hardcoded per-case logic). Phase 2 does NOT include special gems, line crystals, rainbow crystals, bombs, obstacles, levels, world map, coins, lives, boosters, achievements, sound or music, save/load persistence, or a scoring system. Those systems remain deferred to later phases.

## Phase 2 Glossary

- **Game_Board_Screen**: The interactive screen that displays the match-3 Board and is shown when the Play Menu_Button is activated.
- **Board**: The 8x8 grid of Cells that holds the Gems during gameplay.
- **Cell**: A single position on the Board identified by a row index and a column index, each ranging from 0 to 7 inclusive.
- **Gem**: A colored crystal occupying a Cell. Each Gem has exactly one Gem_Type.
- **Gem_Type**: The category of a Gem. The six Gem_Types are Ruby, Sapphire, Emerald, Topaz, Amethyst, and Amber.
- **Match**: A set of three or more Gems of the same Gem_Type that are contiguous in a single row (horizontal) or a single column (vertical).
- **Swap**: The exchange of the positions of two Gems occupying adjacent Cells.
- **Adjacent_Cells**: Two Cells that share an edge, meaning they are in the same row and in columns differing by one, or in the same column and in rows differing by one.
- **Selected_Gem**: The Gem the Player has chosen as the first Gem of a potential Swap.
- **Gravity**: The operation that moves Gems downward within each column to fill empty Cells left below them after Gem removal.
- **Refill**: The operation that generates new Gems to occupy Cells left empty at the top of columns after Gravity.
- **Cascade**: A subsequent round of match detection, removal, Gravity, and Refill triggered automatically because a prior removal produced new Matches.
- **Board_Engine**: The ES_Module solely responsible for Board state and the operations of match detection, removal, Gravity, Refill, and Swap validation.
- **Stable_Board**: A Board state in which no Match exists and every Cell contains exactly one Gem of a valid Gem_Type.

## Phase 2 Requirements

### Requirement 11: Board Structure

**User Story:** As a Player, I want a fixed match-3 board, so that I have a consistent play area.

#### Acceptance Criteria

1. WHEN the Game_Board_Screen is initialized, THE Board_Engine SHALL create a Board consisting of exactly 8 rows and exactly 8 columns, for a total of 64 Cells.
2. WHILE the Board is active, THE Board_Engine SHALL maintain exactly one Gem in every Cell, such that no Cell is empty and no Cell holds more than one Gem.
3. THE Board_Engine SHALL define the Board dimensions as configurable data values rather than as hardcoded literals distributed across match, Gravity, or Refill logic.
4. WHEN a Cell is referenced by a row index and a column index, THE Board_Engine SHALL accept only row indices from 0 to 7 inclusive and column indices from 0 to 7 inclusive.
5. IF a Cell is referenced with a row index or column index outside the range 0 to 7 inclusive, THEN THE Board_Engine SHALL reject the reference and leave the Board state unchanged.

### Requirement 12: Gem Types

**User Story:** As a Player, I want a defined set of crystal types, so that matches are clear and consistent.

#### Acceptance Criteria

1. THE Board_Engine SHALL support exactly six Gem_Types: Ruby, Sapphire, Emerald, Topaz, Amethyst, and Amber.
2. THE Board_Engine SHALL assign every Gem on the Board a Gem_Type drawn only from the six defined Gem_Types.
3. THE Board_Engine SHALL define the set of Gem_Types as a configurable data collection rather than as hardcoded literals distributed across match, Gravity, or Refill logic.
4. IF a Gem is assigned a Gem_Type that is not one of the six defined Gem_Types, THEN THE Board_Engine SHALL reject the assignment and retain the prior Gem_Type of the affected Cell.

### Requirement 13: Initial Board Generation

**User Story:** As a Player, I want the starting board to have no pre-made matches, so that the first move is meaningful.

#### Acceptance Criteria

1. WHEN the Board is generated at the start of gameplay, THE Board_Engine SHALL produce a Board that contains zero Matches.
2. WHEN the Board is generated at the start of gameplay, THE Board_Engine SHALL assign each Cell a Gem whose Gem_Type is one of the six defined Gem_Types.
3. WHEN the Board is generated at the start of gameplay, THE Board_Engine SHALL produce a Stable_Board before the Player is permitted to make a Swap.
4. WHERE the initial random assignment produces one or more Matches, THE Board_Engine SHALL reassign Gems until the Board contains zero Matches.

### Requirement 14: Gem Selection

**User Story:** As a Player, I want to select a gem, so that I can choose which gem to move.

#### Acceptance Criteria

1. WHEN a Player activates a Cell containing a Gem and no Selected_Gem currently exists, THE Board_Engine SHALL mark that Gem as the Selected_Gem.
2. WHEN a Gem becomes the Selected_Gem, THE Game_Board_Screen SHALL display a visual selection indication on that Gem within 100 milliseconds.
3. WHEN a Player activates the Cell of the current Selected_Gem, THE Board_Engine SHALL clear the Selected_Gem and remove the selection indication.
4. WHILE a Selected_Gem exists, THE Board_Engine SHALL retain exactly one Selected_Gem until the Selected_Gem is cleared or a Swap is attempted.

### Requirement 15: Swap Interaction

**User Story:** As a Player, I want to swap a selected gem with an adjacent gem, so that I can form matches.

#### Acceptance Criteria

1. WHEN a Selected_Gem exists and the Player activates a Cell that is one of the Adjacent_Cells of the Selected_Gem, THE Board_Engine SHALL attempt a Swap between the Selected_Gem and the Gem in the activated Cell.
2. THE Board_Engine SHALL permit a Swap only between two Gems occupying Adjacent_Cells.
3. IF a Selected_Gem exists and the Player activates a Cell that is not one of the Adjacent_Cells of the Selected_Gem and that Cell contains a Gem, THEN THE Board_Engine SHALL reject the Swap and set the Selected_Gem to the Gem in the newly activated Cell.
4. WHEN a Swap is attempted between two Adjacent_Cells, THE Board_Engine SHALL evaluate the resulting Board for Matches, and WHERE the resulting Board contains at least one Match anywhere on the Board, THE Board_Engine SHALL keep the Swap and clear the Selected_Gem.
5. IF a Swap is attempted between two Adjacent_Cells and the resulting Board contains no Match anywhere on the Board, THEN THE Board_Engine SHALL return both Gems to their pre-Swap Cells and clear the Selected_Gem.
6. WHEN a Swap is kept or reverted, THE Game_Board_Screen SHALL update the displayed Board to reflect the final Cell positions within 300 milliseconds.

### Requirement 16: Match Detection

**User Story:** As a Player, I want lines of three or more matching gems detected, so that my moves score correctly.

#### Acceptance Criteria

1. THE Board_Engine SHALL identify a horizontal Match as three or more Gems of the same Gem_Type occupying contiguous Cells within a single row.
2. THE Board_Engine SHALL identify a vertical Match as three or more Gems of the same Gem_Type occupying contiguous Cells within a single column.
3. WHEN match detection runs, THE Board_Engine SHALL identify every Match present on the Board across all rows and all columns.
4. WHERE two or more Matches share one or more Cells, THE Board_Engine SHALL include every Cell belonging to any Match in the set of matched Cells.
5. IF the Board contains no three-or-more contiguous same-type sequence in any row or column, THEN THE Board_Engine SHALL report zero Matches.

### Requirement 17: Gem Removal

**User Story:** As a Player, I want matched gems to be removed, so that space opens for new gems.

#### Acceptance Criteria

1. WHEN one or more Matches are detected, THE Board_Engine SHALL remove every Gem belonging to any detected Match, leaving those Cells empty.
2. WHEN Gems are removed, THE Board_Engine SHALL leave all Gems that do not belong to any Match unchanged in their Cells.
3. WHEN Gems are removed, THE Game_Board_Screen SHALL update the display to show the removed Gems as cleared within 300 milliseconds.

### Requirement 18: Gravity

**User Story:** As a Player, I want gems above empty spaces to fall, so that the board fills naturally.

#### Acceptance Criteria

1. WHEN one or more Cells are empty after Gem removal, THE Board_Engine SHALL move each remaining Gem in an affected column downward so that all Gems in that column occupy the lowest available Cells and all empty Cells rise to the top of that column.
2. WHEN Gravity is applied, THE Board_Engine SHALL preserve the relative vertical order of the remaining Gems within each column.
3. WHEN Gravity is applied, THE Board_Engine SHALL leave Gems in columns that contain no empty Cell in their existing positions.

### Requirement 19: Refill

**User Story:** As a Player, I want new gems to appear, so that the board is always full and playable.

#### Acceptance Criteria

1. WHEN empty Cells remain at the top of one or more columns after Gravity, THE Board_Engine SHALL generate a new Gem for each empty Cell, assigning each new Gem a Gem_Type from the six defined Gem_Types.
2. WHEN Refill completes, THE Board_Engine SHALL ensure every Cell of the Board contains exactly one Gem.
3. WHEN Refill completes, THE Game_Board_Screen SHALL display the newly generated Gems within 300 milliseconds.

### Requirement 20: Cascade Resolution

**User Story:** As a Player, I want chain reactions to resolve automatically, so that gameplay flows without extra input.

#### Acceptance Criteria

1. WHEN Refill produces a Board that contains one or more Matches, THE Board_Engine SHALL automatically perform a Cascade consisting of match detection, removal, Gravity, and Refill without requiring Player input.
2. WHILE the Board contains one or more Matches after any removal, THE Board_Engine SHALL continue performing Cascades until the Board contains zero Matches.
3. WHEN cascade resolution completes, THE Board_Engine SHALL leave the Board as a Stable_Board.
4. WHILE a Cascade is in progress, THE Board_Engine SHALL prevent the Player from initiating a new Swap until the Board reaches a Stable_Board.

### Requirement 21: Board State Consistency

**User Story:** As a Developer, I want the board state to remain valid after every operation, so that gameplay is reliable and testable.

#### Acceptance Criteria

1. WHEN the Board reaches a Stable_Board and the Player is permitted to make a new move, THE Board_Engine SHALL ensure every one of the 64 Cells contains exactly one Gem of a valid Gem_Type and the Board contains zero Matches.
2. WHILE match removal, Gravity, or Refill is in progress as an intermediate step, THE Board_Engine SHALL permit temporary empty Cells until Refill completes and the Board returns to a Stable_Board.
3. WHEN any Board operation (Swap, match detection, removal, Gravity, Refill, or Cascade) completes, whether the resulting state is intermediate or stable, THE Board_Engine SHALL keep the Board dimensions at exactly 8 rows by 8 columns and SHALL assign every occupied Cell a Gem of a valid Gem_Type.
4. WHEN cascade resolution completes and the Player is permitted to act, THE Board_Engine SHALL ensure the Board contains zero Matches.
5. IF a Board operation would leave the Board with an invalid Gem_Type or with dimensions other than 8 rows by 8 columns, THEN THE Board_Engine SHALL reject that operation and retain the prior Stable_Board.
6. IF the Board is presented to the Player as ready for a new move while any Cell is empty or any Cell holds more than one Gem, THEN THE Board_Engine SHALL reject that state and retain the prior Stable_Board.

### Requirement 22: Input Support

**User Story:** As a Player, I want to play with mouse or touch, so that I can play on desktop or mobile.

#### Acceptance Criteria

1. WHEN a Player activates a Cell using a mouse click on the Cell, THE Game_Board_Screen SHALL route the activation to the Board_Engine as a Cell activation.
2. WHEN a Player activates a Cell using a touch tap on the Cell, THE Game_Board_Screen SHALL route the activation to the Board_Engine as a Cell activation equivalent to a mouse click activation.
3. THE Game_Board_Screen SHALL treat a Cell activation as a discrete click or tap on a single Cell, and THE Game_Board_Screen SHALL NOT require a swipe or drag gesture to perform a Swap, such that swipe and drag gestures are out of scope for Phase 2.
4. THE Game_Board_Screen SHALL render each Cell as a Touch_Target with a minimum height of 44 CSS pixels and a minimum width of 44 CSS pixels.
5. WHEN a Player activates a Cell, THE Game_Board_Screen SHALL respond with a visible change within 100 milliseconds of the activation.

### Requirement 23: Responsive Board Layout

**User Story:** As a Player, I want the board to fit my screen, so that it is usable on mobile and desktop.

#### Acceptance Criteria

1. WHILE the Viewport is displayed at any width between 320 CSS pixels and 2560 CSS pixels, THE Game_Board_Screen SHALL render the complete 8x8 Board fully within the horizontal bounds of the Viewport with zero horizontal overflow such that no horizontal scrollbar appears.
2. WHILE the Viewport is displayed at any width between 320 CSS pixels and 2560 CSS pixels, THE Game_Board_Screen SHALL keep the Board square such that Cell width equals Cell height for every Cell.
3. WHILE the Viewport width is greater than 768 CSS pixels, THE Game_Board_Screen SHALL center the Board horizontally within the Viewport.
4. WHERE the complete Game_Board_Screen content height exceeds the Viewport height, THE Game_Board_Screen SHALL permit vertical scrolling to reach the remaining content while keeping horizontal overflow at zero, such that fitting the complete user interface vertically without scrolling is not required.
5. THE Game_Board_Screen SHALL provide a control that returns the Player to the Main_Menu within 500 milliseconds of activation.

### Requirement 24: Play Navigation Integration

**User Story:** As a Player, I want the Play button to open the game board, so that I can start playing from the menu.

#### Acceptance Criteria

1. WHEN a Player activates the Play Menu_Button, THE Router SHALL display the Game_Board_Screen within 500 milliseconds.
2. THE Router SHALL continue to display the existing Placeholder_Screens for the World Map, Boosters, Achievements, and Settings Menu_Buttons without change.
3. WHEN the Game_Board_Screen is displayed and the Player activates the return control, THE Router SHALL display the Main_Menu within 500 milliseconds.
4. WHERE Phase 2 gameplay ES_Modules are added, THE SnoopsGem_Game SHALL integrate them without modifying the Main_Menu UI_Module.

### Requirement 25: Gameplay Test Coverage

**User Story:** As a Developer, I want automated tests for the gameplay logic, so that Phase 2 behavior is verified and stays correct.

#### Acceptance Criteria

1. THE SnoopsGem_Game test suite SHALL include a test verifying that a generated Board has exactly 8 rows and exactly 8 columns.
2. THE SnoopsGem_Game test suite SHALL include a test verifying that every Gem on a generated Board has a Gem_Type drawn only from the six defined Gem_Types.
3. THE SnoopsGem_Game test suite SHALL include a test verifying that a newly generated initial Board contains zero Matches.
4. THE SnoopsGem_Game test suite SHALL include a test verifying that a Swap between two Adjacent_Cells is accepted as a valid Swap attempt.
5. THE SnoopsGem_Game test suite SHALL include a test verifying that a Swap attempt between two non-adjacent Cells is rejected.
6. THE SnoopsGem_Game test suite SHALL include a test verifying that a horizontal sequence of three or more same-type Gems is detected as a Match.
7. THE SnoopsGem_Game test suite SHALL include a test verifying that a vertical sequence of three or more same-type Gems is detected as a Match.
8. THE SnoopsGem_Game test suite SHALL include a test verifying that all Gems belonging to a detected Match are removed and non-matched Gems are retained.
9. THE SnoopsGem_Game test suite SHALL include a test verifying that after Gravity, remaining Gems in each column occupy the lowest available Cells while preserving their relative vertical order.
10. THE SnoopsGem_Game test suite SHALL include a test verifying that after Refill, every Cell of the Board contains exactly one Gem of a valid Gem_Type.
11. THE SnoopsGem_Game test suite SHALL include a test verifying that a Swap producing no Match is reverted to the pre-Swap positions.
12. THE SnoopsGem_Game test suite SHALL include a test verifying that cascade resolution continues until the Board contains zero Matches, resulting in a Stable_Board.
13. THE SnoopsGem_Game test suite SHALL include a property test verifying that, for many randomly generated inputs, the Board contains exactly one valid Gem per Cell and zero Matches after cascade resolution completes (Stable_Board invariant).
14. THE SnoopsGem_Game test suite SHALL include a property test verifying that, for many randomly generated Boards, applying Gravity preserves the multiset of non-empty Gems in each column (Gravity does not create or destroy Gems).

---

## Phase 3 Introduction: Special Gems, Scoring, and Data-Driven Levels

Phase 3 extends the completed Phase 2 core match-3 engine with special gems, special-gem activation and combinations, a scoring system, and the foundation of a data-driven level system with move limits, objectives, and win/lose state. Phase 3 builds on the Phase 1 foundation (modular ES-module architecture, Router, Main_Menu, Placeholder_Screens) and the Phase 2 engine (Board, Gem, Match, Gravity, Refill, Cascade, Stable_Board). Phase 2 is complete and MUST remain functional.

Phase 3 is strictly additive and preserves the existing pure-logic / DOM-separated architecture established in Phase 2. Pure game logic (special-gem creation, activation, combinations, score calculation, objective tracking, move accounting, and level state transitions) remains independent of the DOM. The Game_Board_Screen may orchestrate user interaction and rendering but MUST NOT duplicate pure engine algorithms such as match detection, Gravity, Refill, special-effect calculation, score formulas, or objective formulas. The existing board, gem, and match module APIs remain backward-compatible unless a documented Phase 3 requirement requires a change. All existing Phase 2 tests MUST continue to pass.

Phase 3 continues to use no framework: Vanilla JavaScript ES_Modules, with Vitest for tests and fast-check for property tests. Property tests MUST run a minimum of 100 iterations each. All gameplay logic MUST be deterministic given the same board, actions, level configuration, and RNG seed, using an injectable RNG rather than uncontrolled random calls where deterministic behavior is required. Swipe and drag gestures remain out of scope; interaction stays click/tap based.

The official game name remains "SnoopsGem : Crystal" and the internal spec identifier remains gemoria-crystal-quest.

Explicitly out of scope for Phase 3: World Map, lives/hearts, coins/economy, boosters outside Special Gems, shop/store, achievements, sound/music, save/load persistence, online features, accounts/authentication, multiplayer, ads, social features, backend/server, full 100-level content production, advanced obstacles (ice, chain, stone, portals, blockers), and animation-heavy effects not required for correctness.

## Phase 3 Glossary

- **Special_Gem**: A Gem that carries a Special_Gem_Type other than normal and produces a defined clearing effect when activated. A Special_Gem retains an underlying Base_Gem_Type where applicable.
- **Base_Gem_Type**: One of the six Phase 2 Gem_Types (Ruby, Sapphire, Emerald, Topaz, Amethyst, Amber) that identifies the color category of a Gem.
- **Special_Gem_Type**: The category of a Gem with respect to special behavior. The five Special_Gem_Types are normal, line_horizontal, line_vertical, rainbow, and bomb.
- **Normal_Gem**: A Gem whose Special_Gem_Type is normal and whose Base_Gem_Type is one of the six Base_Gem_Types.
- **Line_Crystal**: A Special_Gem of Special_Gem_Type line_horizontal or line_vertical that, when activated, clears an entire row or column respectively.
- **Rainbow_Crystal**: A Special_Gem of Special_Gem_Type rainbow that, when activated in combination with a Normal_Gem, clears all Gems sharing the selected Normal_Gem's Base_Gem_Type.
- **Bomb_Crystal**: A Special_Gem of Special_Gem_Type bomb that, when activated, clears a defined surrounding area centered on the bomb.
- **Gem_ID**: A unique identifier assigned to a Gem that distinguishes it from every other Gem within the active Board state.
- **Creation_Cell**: The deterministically chosen Cell within a resolved Match at which a newly created Special_Gem is placed.
- **Special_Activation**: The operation of applying a Special_Gem's clearing effect to the Board.
- **Special_Combination**: The effect produced when two Special_Gems are swapped into each other, taking precedence over individual activation.
- **Level_Configuration**: A data-driven definition of a level, specifying at minimum a level identifier, Board dimensions, available Base_Gem_Types, a Move_Limit, an Objective_Type, and an Objective_Target.
- **Objective**: A completion goal for a level defined by an Objective_Type and a numeric Objective_Target.
- **Objective_Type**: The category of an Objective. The Phase 3 Objective_Types are score target and collect-gem-type target.
- **Objective_Target**: The numeric value that the tracked Objective quantity must reach or exceed for the Objective to be satisfied.
- **Objective_Progress**: The current tracked quantity measured against the Objective_Target.
- **Move_Limit**: The maximum number of committed player moves permitted in a level.
- **Remaining_Moves**: The number of committed moves still available in the active level.
- **Score**: The non-negative numeric total accumulated during an active level.
- **Level_Status**: The state of the active level, drawn from the finite set playing, won, and lost.
- **Committed_Move**: A player-initiated Swap or Special_Combination that results in at least one Match or valid special effect and is retained.
- **RNG**: The injectable random number generator used by the Board_Engine so that gem generation is deterministic given a fixed seed.
- **Level_Engine**: The pure ES_Module solely responsible for Level_Configuration validation, Move_Limit tracking, Objective tracking, Score accumulation, and Level_Status transitions, independent of the DOM.

## Phase 3 Requirements

### Requirement 26: Special Gem Model

**User Story:** As a Player, I want gems that carry special powers, so that clever matches can produce more powerful clears.

#### Acceptance Criteria

1. THE Board_Engine SHALL support exactly five Special_Gem_Types: normal, line_horizontal, line_vertical, rainbow, and bomb.
2. WHERE a Gem's Special_Gem_Type is normal, THE Board_Engine SHALL assign that Gem exactly one Base_Gem_Type drawn from the six Base_Gem_Types.
3. WHERE a Gem's Special_Gem_Type is line_horizontal, line_vertical, or bomb, THE Board_Engine SHALL retain the underlying Base_Gem_Type of that Gem.
4. THE Board_Engine SHALL assign every Gem a Gem_ID that is unique within the active Board state.
5. THE Board_Engine SHALL represent each Special_Gem with its Base_Gem_Type where applicable, its Special_Gem_Type, and its Gem_ID.
6. THE Board_Engine SHALL make every Normal_Gem distinguishable from every Special_Gem by Special_Gem_Type.
7. IF a Gem is assigned a Special_Gem_Type that is not one of the five defined Special_Gem_Types, THEN THE Board_Engine SHALL reject the assignment and retain the prior Board state unchanged.
8. WHERE a Board contains only Normal_Gems, THE Board_Engine SHALL perform matching, swapping, removal, Gravity, Refill, Cascade, and Stable_Board validation identically to Phase 2 behavior.

### Requirement 27: Line Crystal Creation

**User Story:** As a Player, I want matching four gems in a row or column to create a line crystal, so that I can clear a whole line.

#### Acceptance Criteria

1. WHEN a Match of exactly four compatible Normal_Gems is resolved horizontally, THE Board_Engine SHALL create a line_horizontal Line_Crystal at the designated Creation_Cell.
2. WHEN a Match of exactly four compatible Normal_Gems is resolved vertically, THE Board_Engine SHALL create a line_vertical Line_Crystal at the designated Creation_Cell.
3. THE Board_Engine SHALL select the Creation_Cell for a Line_Crystal deterministically from the matched Cells, independent of DOM ordering.
4. WHEN a Line_Crystal is created from a resolved Match, THE Board_Engine SHALL preserve the created Line_Crystal at its Creation_Cell while removing the other matched Gems of that Match.
5. WHEN a Match of exactly three Normal_Gems is resolved, THE Board_Engine SHALL remove the matched Gems without creating any Special_Gem.

### Requirement 28: Rainbow Crystal Creation

**User Story:** As a Player, I want matching five gems in a line to create a rainbow crystal, so that I can clear all gems of one type.

#### Acceptance Criteria

1. WHEN a straight Match of five or more compatible Normal_Gems is resolved, THE Board_Engine SHALL create a Rainbow_Crystal at the designated Creation_Cell.
2. THE Board_Engine SHALL select the Creation_Cell for a Rainbow_Crystal deterministically from the matched Cells, independent of DOM ordering.
3. WHEN a Rainbow_Crystal is created from a resolved Match, THE Board_Engine SHALL preserve the created Rainbow_Crystal at its Creation_Cell while removing the remaining matched Gems of that Match.
4. WHEN a straight Match of fewer than five Normal_Gems is resolved, THE Board_Engine SHALL create no Rainbow_Crystal.

### Requirement 29: Bomb Crystal Creation

**User Story:** As a Player, I want intersecting matches to create a bomb crystal, so that I can clear a surrounding area.

#### Acceptance Criteria

1. WHEN a Match forms a T-shaped or L-shaped intersection of compatible Normal_Gems, THE Board_Engine SHALL create a Bomb_Crystal at the designated Creation_Cell.
2. THE Board_Engine SHALL select the Creation_Cell for a Bomb_Crystal deterministically from the intersecting matched Cells, independent of DOM ordering.
3. WHEN a Bomb_Crystal is created from a resolved intersection Match, THE Board_Engine SHALL preserve the created Bomb_Crystal at its Creation_Cell while removing the remaining matched Gems of that Match.
4. WHEN a simple straight Match that does not satisfy a T-shaped or L-shaped intersection is resolved, THE Board_Engine SHALL create no Bomb_Crystal.

### Requirement 30: Special Gem Activation

**User Story:** As a Player, I want activating a special gem to clear gems, so that special gems have a meaningful effect.

#### Acceptance Criteria

1. WHEN a line_horizontal Line_Crystal is activated, THE Board_Engine SHALL clear all applicable Gems in the row containing that Line_Crystal.
2. WHEN a line_vertical Line_Crystal is activated, THE Board_Engine SHALL clear all applicable Gems in the column containing that Line_Crystal.
3. WHEN a Rainbow_Crystal is activated in combination with a selected Normal_Gem, THE Board_Engine SHALL determine the selected Normal_Gem's Base_Gem_Type before removal and SHALL clear all applicable Gems whose Base_Gem_Type matches that determined Base_Gem_Type.
4. WHEN a Bomb_Crystal is activated, THE Board_Engine SHALL clear the defined surrounding area, defaulting to the 3x3 area centered on the Bomb_Crystal, clipped at Board boundaries.
5. WHILE a Special_Gem is positioned at an edge or corner of the Board, THE Board_Engine SHALL clip its effect to valid Cells and SHALL NOT access any Cell outside the range 0 to 7 inclusive for row or column.
6. WHEN a Special_Activation removes one or more Gems, THE Board_Engine SHALL integrate the removal into the existing Cascade process by removing affected Gems, applying Gravity, applying Refill, detecting Matches, and continuing until the Board reaches a Stable_Board.
7. WHERE a Special_Activation affects a Cell containing another Special_Gem within the same resolution, THE Board_Engine SHALL apply a deterministic chain-activation behavior and SHALL terminate the chain without an infinite loop.

### Requirement 31: Special Gem Combinations

**User Story:** As a Player, I want to combine two special gems, so that I can trigger more powerful clears.

#### Acceptance Criteria

1. WHEN a Line_Crystal is combined with a Line_Crystal, THE Board_Engine SHALL clear the full row and the full column intersecting at the combination location.
2. WHEN a Rainbow_Crystal is combined with a Normal_Gem, THE Board_Engine SHALL clear every Normal_Gem whose Base_Gem_Type equals the selected Normal_Gem's Base_Gem_Type.
3. WHEN a Rainbow_Crystal is combined with a Line_Crystal, THE Board_Engine SHALL apply a deterministic enhanced line-clear affecting the selected Base_Gem_Type, with the exact affected rows and columns defined in the Design and covered by tests.
4. WHEN a Rainbow_Crystal is combined with a Rainbow_Crystal, THE Board_Engine SHALL apply a deterministic board-wide clearing effect defined in the Design and covered by tests.
5. WHEN a Bomb_Crystal is combined with a Line_Crystal, THE Board_Engine SHALL apply a deterministic combined area-and-line clearing effect defined in the Design and covered by tests.
6. WHEN a Bomb_Crystal is combined with a Rainbow_Crystal, THE Board_Engine SHALL apply a deterministic enhanced clearing effect defined in the Design and covered by tests.
7. WHEN a Bomb_Crystal is combined with a Bomb_Crystal, THE Board_Engine SHALL apply a deterministic larger-area clearing effect defined in the Design and covered by tests.
8. WHEN a Special_Combination is triggered, THE Board_Engine SHALL apply the combination effect in precedence over individual activation and SHALL consume each of the two participating Special_Gems exactly once.
9. WHERE two Special_Gems co-exist on the Board without being swapped into Adjacent_Cells, THE Board_Engine SHALL NOT apply a Special_Combination merely because both Special_Gems are present.

### Requirement 32: Special Gem Swap Rules

**User Story:** As a Player, I want special gems to work within the existing swap system, so that controls stay consistent.

#### Acceptance Criteria

1. THE Board_Engine SHALL allow a Special_Gem to participate in the Phase 2 adjacent-Swap system as a swappable Gem.
2. WHEN a Special_Gem is swapped with an adjacent Normal_Gem and the Swap is valid, THE Board_Engine SHALL activate the Special_Gem according to the Phase 3 activation rules.
3. WHEN a Special_Gem is swapped with an adjacent Special_Gem, THE Board_Engine SHALL resolve the interaction using the Special_Combination rules of Requirement 31.
4. IF a Swap involving a Special_Gem produces no Match and no valid Special_Activation and no valid Special_Combination, THEN THE Board_Engine SHALL revert the Swap according to the Phase 2 revert rules.
5. THE Board_Engine SHALL retain the existing Phase 2 selection and deselection behavior unchanged for both Normal_Gems and Special_Gems.

### Requirement 33: Match Resolution and Special Creation

**User Story:** As a Player, I want matches classified correctly, so that the right special gems are created.

#### Acceptance Criteria

1. WHEN match detection runs, THE Board_Engine SHALL distinguish among a 3-match, a horizontal 4-match, a vertical 4-match, a straight 5-or-more match, a T-shaped match, and an L-shaped match.
2. WHERE the Board contains multiple Matches in a single resolution, THE Board_Engine SHALL resolve them deterministically.
3. WHERE a horizontal run and a vertical run overlap, THE Board_Engine SHALL analyze them as a combined structure before deciding Special_Gem creation.
4. WHEN a Match qualifies for Special_Gem creation, THE Board_Engine SHALL create the Special_Gem before performing the final removal of matched Gems.
5. WHEN a Match includes an existing Special_Gem, THE Board_Engine SHALL handle that Special_Gem through the activation rules and SHALL NOT silently convert it to a Normal_Gem.
6. WHEN match resolution and all Cascades complete, THE Board_Engine SHALL leave the Board as a Stable_Board, unless the Level_Status intentionally ends the move first.

### Requirement 34: Score System

**User Story:** As a Player, I want to earn points, so that my performance is measured.

#### Acceptance Criteria

1. THE Level_Engine SHALL maintain a numeric Score for the active level.
2. WHEN a normal Match is removed, THE Level_Engine SHALL increase the Score based on the number of Gems removed.
3. WHERE a Match removes more Gems than the minimum of three, THE Level_Engine SHALL add a larger-match bonus beyond the base removal Score.
4. WHEN a Special_Gem is created, THE Level_Engine SHALL add a special-creation bonus to the Score.
5. WHEN a Special_Gem is activated, THE Level_Engine SHALL add a special-activation bonus to the Score based on the number and effect of the Gems affected.
6. WHEN a Special_Combination is triggered, THE Level_Engine SHALL add a combination bonus to the Score.
7. WHEN a Cascade occurs, THE Level_Engine SHALL add a cascade bonus that distinguishes cascade depth such that later Cascades receive an appropriate bonus.
8. WHERE the same Board, actions, Level_Configuration, and RNG seed are provided, THE Level_Engine SHALL produce the same Score.
9. THE Level_Engine SHALL keep the Score at zero or greater at all times.
10. THE Level_Engine SHALL calculate the Score independently of the DOM, and THE Game_Board_Screen SHALL display the Score without duplicating any Score formula.

### Requirement 35: Level Configuration

**User Story:** As a Developer, I want levels defined as data, so that new levels can be added without changing engine logic.

#### Acceptance Criteria

1. THE Level_Engine SHALL accept a data-driven Level_Configuration defining at minimum a level identifier, Board dimensions, available Base_Gem_Types, a Move_Limit, an Objective_Type, and an Objective_Target.
2. WHERE no supported alternate dimension is required by a test or configuration, THE Level_Engine SHALL use an 8x8 Board for Phase 3.
3. THE Level_Configuration SHALL define the available Normal_Gem types as a subset of the six Base_Gem_Types.
4. THE Level_Configuration SHALL define a Move_Limit as the maximum number of committed moves for the level.
5. THE Level_Configuration SHALL support at least two Objective_Types: a score target and a collect-gem-type target.
6. THE Level_Configuration SHALL define a numeric Objective_Target for each Objective.
7. IF a Level_Configuration is invalid, THEN THE Level_Engine SHALL reject the Level_Configuration before gameplay begins and SHALL NOT produce a corrupted playable Board.

### Requirement 36: Move Tracking

**User Story:** As a Player, I want a limited number of moves, so that levels present a challenge.

#### Acceptance Criteria

1. WHEN a level begins, THE Level_Engine SHALL initialize Remaining_Moves to the configured Move_Limit.
2. WHEN a Committed_Move completes, THE Level_Engine SHALL decrease Remaining_Moves by exactly one.
3. IF a Swap is rejected or reverted, THEN THE Level_Engine SHALL leave Remaining_Moves unchanged.
4. WHEN a player-initiated valid Special_Combination completes, THE Level_Engine SHALL count it as exactly one Committed_Move.
5. WHILE automatic Cascades are resolving, THE Level_Engine SHALL leave Remaining_Moves unchanged.
6. THE Level_Engine SHALL keep Remaining_Moves at zero or greater at all times.

### Requirement 37: Objective Tracking

**User Story:** As a Player, I want a clear goal, so that I know how to win a level.

#### Acceptance Criteria

1. WHERE the Objective_Type is a score target, THE Level_Engine SHALL mark the Objective satisfied when the Score is greater than or equal to the Objective_Target.
2. WHERE the Objective_Type is a collect-gem-type target, THE Level_Engine SHALL track the count of applicable Gems removed toward the Objective_Target.
3. WHEN Gems are removed during a Cascade, THE Level_Engine SHALL count applicable removed Gems toward the Objective_Progress.
4. WHEN Gems are removed by a special effect, THE Level_Engine SHALL count applicable removed Gems toward the Objective_Progress.
5. THE Level_Engine SHALL track Objective_Progress as pure logic without any DOM dependency.

### Requirement 38: Level Win State

**User Story:** As a Player, I want to win when I meet the goal, so that my success is recognized.

#### Acceptance Criteria

1. WHEN all Objectives of the active level are satisfied, THE Level_Engine SHALL set the Level_Status to won.
2. WHERE Objectives become satisfied during a Cascade, THE Level_Engine SHALL evaluate the win condition after the Cascade resolution completes.
3. WHEN a move satisfies the win condition, THE Level_Engine SHALL complete the required Cascade resolution before the level is presented as complete.
4. WHILE the Level_Status is won, THE Board_Engine SHALL ignore further Player input.

### Requirement 39: Level Lose State

**User Story:** As a Player, I want to lose when I run out of moves, so that levels have real stakes.

#### Acceptance Criteria

1. WHEN Remaining_Moves reaches zero and the Objectives are not satisfied, THE Level_Engine SHALL set the Level_Status to lost.
2. WHEN the final move triggers a Cascade, THE Level_Engine SHALL complete the Cascade resolution before determining the final Level_Status.
3. WHILE the Level_Status is lost, THE Board_Engine SHALL ignore further Player input.
4. IF the final move satisfies the Objectives while reducing Remaining_Moves to zero, THEN THE Level_Engine SHALL set the Level_Status to won rather than lost.

### Requirement 40: Restart Level

**User Story:** As a Player, I want to restart a level, so that I can try again after winning or losing.

#### Acceptance Criteria

1. WHILE a level is active or has ended, THE Game_Board_Screen SHALL provide a restart control.
2. WHEN the restart control is activated, THE Level_Engine SHALL reset the Board, the Score, the Remaining_Moves, the Objective_Progress, the Level_Status, the current selection, and the resolving state.
3. WHEN a level is restarted, THE Board_Engine SHALL generate a valid Stable_Board.
4. WHEN a level is restarted, THE Level_Engine SHALL leave no state carried over from the previous attempt.
5. THE Game_Board_Screen SHALL make the restart control available after both a won Level_Status and a lost Level_Status.

### Requirement 41: Game State Extension

**User Story:** As a Developer, I want the game state to hold level data, so that gameplay progress is tracked cleanly.

#### Acceptance Criteria

1. THE Level_Engine SHALL extend the existing Phase 1 game-state scaffold without coupling the extended state to the DOM.
2. THE active game state SHALL represent the active level, the Score, the Remaining_Moves, the Objective_Progress, and the Level_Status.
3. THE Level_Status SHALL be drawn from the finite set of values playing, won, and lost, with the exact representation documented in the Design.
4. THE Level_Engine SHALL support resetting the active level cleanly to its initial configured state.

### Requirement 42: UI Requirements

**User Story:** As a Player, I want to see my score, moves, and objective, so that I can track my progress.

#### Acceptance Criteria

1. WHILE a level is active, THE Game_Board_Screen SHALL display the current Score.
2. WHILE a level is active, THE Game_Board_Screen SHALL display the Remaining_Moves.
3. WHILE a level is active, THE Game_Board_Screen SHALL display the active Objective and the Objective_Progress.
4. THE Game_Board_Screen SHALL visibly communicate whether the Level_Status is playing, won, or lost.
5. WHILE a level is active or ended, THE Game_Board_Screen SHALL provide a control that restarts the current level.
6. THE Game_Board_Screen SHALL render each Special_Gem visually distinguishable from a Normal_Gem using a distinction that does not rely solely on color.
7. WHERE a Special_Gem is displayed, THE Game_Board_Screen SHALL provide a meaningful accessible label or text alternative for that Special_Gem's state.
8. THE Game_Board_Screen SHALL maintain the Phase 2 responsive constraints, rendering with zero horizontal overflow, square Cells, a minimum Touch_Target of 44 by 44 CSS pixels, usable layout on mobile and desktop, and horizontally centered content on Viewport widths greater than 768 CSS pixels.

### Requirement 43: Input and Interaction

**User Story:** As a Player, I want reliable controls during special effects, so that the game does not misbehave.

#### Acceptance Criteria

1. WHEN a Player activates a Cell using a mouse click or a touch tap, THE Game_Board_Screen SHALL route the activation to the Board_Engine.
2. THE Game_Board_Screen SHALL NOT require a swipe or drag gesture, such that swipe and drag remain out of scope for Phase 3.
3. WHILE a Special_Activation or Cascade resolution is in progress, THE Board_Engine SHALL block Player input until the Board reaches a Stable_Board.
4. WHILE the Level_Status is won or lost, THE Board_Engine SHALL block Player input.
5. WHEN a single triggering event activates a Special_Gem, THE Board_Engine SHALL activate that Special_Gem exactly once for that event.

### Requirement 44: Performance and Safety

**User Story:** As a Developer, I want bounded, safe resolution, so that the engine never hangs or corrupts state.

#### Acceptance Criteria

1. THE Board_Engine SHALL apply an explicit safety bound to Special_Activation and Cascade resolution.
2. WHILE a special-gem chain is resolving, THE Board_Engine SHALL terminate the chain without producing an infinite loop.
3. WHEN any resolution completes, THE Board_Engine SHALL keep the Board dimensions unchanged and SHALL assign every occupied Cell a valid Base_Gem_Type and a valid Special_Gem_Type.
4. WHEN resolution completes and the level is playable, THE Board_Engine SHALL leave the Board as a Stable_Board.
5. IF an operation would produce an invalid Board or invalid game state, THEN THE Board_Engine SHALL reject the operation and retain the previous valid game state unchanged.

### Requirement 45: Testing Requirements

**User Story:** As a Developer, I want comprehensive automated tests, so that Phase 3 behavior is verified and stays correct.

#### Acceptance Criteria

1. THE SnoopsGem_Game test suite SHALL retain all Phase 2 tests in a passing state such that no Phase 3 implementation breaks a Phase 2 requirement.
2. THE SnoopsGem_Game test suite SHALL include Special_Gem unit tests covering creation, validation, line_horizontal creation, line_vertical creation, rainbow creation, bomb creation, deterministic Creation_Cell selection, preservation of the created Special_Gem, and rejection of invalid Special_Gem_Types.
3. THE SnoopsGem_Game test suite SHALL include Special_Activation tests covering line_horizontal, line_vertical, rainbow, and bomb activation, edge and corner handling, affected-cell correctness, absence of duplicate removal, and single activation per trigger.
4. THE SnoopsGem_Game test suite SHALL include combination tests covering line+line, rainbow+normal, rainbow+line, rainbow+rainbow, bomb+line, bomb+rainbow, and bomb+bomb.
5. THE SnoopsGem_Game test suite SHALL include match-classification tests covering 3-match, horizontal 4-match, vertical 4-match, 5-or-more match, T-shaped match, L-shaped match, overlapping runs, deterministic Creation_Cell, and absence of accidental Special_Gem creation.
6. THE SnoopsGem_Game test suite SHALL include Cascade tests verifying that Special_Activation enters the Cascade, that Cascades continue until no Matches remain, that a Stable_Board is reached, that resolving blocks input, that resolution is bounded, and that special chains terminate.
7. THE SnoopsGem_Game test suite SHALL include Score tests covering normal match Score, larger-match bonus, special-creation bonus, special-activation Score, combination bonus, cascade bonus, deterministic scoring, and non-negative Score.
8. THE SnoopsGem_Game test suite SHALL include level tests covering valid Level_Configuration, rejection of invalid Level_Configuration, Move_Limit initialization, valid decrement, absence of decrement on invalid moves, absence of decrement during Cascades, Objective tracking, win state, lose state, win priority on the final move, and restart reset.
9. THE SnoopsGem_Game test suite SHALL include property tests using fast-check with a minimum of 100 iterations each: property P2 verifying that special resolution preserves Board invariants (valid dimensions, valid types, no invalid Cells, and Stable_Board when active); property P3 verifying that Special_Activation is boundary-safe and never accesses or produces invalid coordinates including corners and edges; property P4 verifying that the Score is monotonic and never decreases over a valid sequence; and property P6 verifying move accounting such that valid moves consume exactly one move, reverted invalid moves consume zero, and Cascades consume zero; and THE test suite SHALL keep the existing properties P1 and P5 passing.
10. THE SnoopsGem_Game test suite SHALL include integration tests running under jsdom covering Special_Gem rendering, selection, activation, combination, Score display, move display, Objective display, win state, loss state, restart, input blocking, and navigation compatibility.
11. THE SnoopsGem_Game test suite SHALL use an injectable RNG wherever random generation affects assertions, avoiding uncontrolled random calls where deterministic behavior is required.

### Requirement 46: Architecture and Scope Protection

**User Story:** As a Developer, I want the architecture and scope protected, so that Phase 3 stays clean and additive.

#### Acceptance Criteria

1. THE SnoopsGem_Game SHALL keep the pure engine testable without the DOM for Special_Gem creation, activation, combinations, Score, Objective tracking, move accounting, and Level_Status transitions.
2. THE Game_Board_Screen SHALL orchestrate user interface and interaction, and SHALL NOT duplicate match detection, Gravity, Refill, special-effect calculation, Score formulas, or Objective formulas.
3. THE SnoopsGem_Game SHALL keep the Phase 1 architecture intact, and SHALL NOT modify the entry point ES_Module or the Router ES_Module unless a documented Phase 3 requirement explicitly requires the change.
4. THE Main_Menu SHALL continue to contain exactly the Play, World Map, Boosters, Achievements, and Settings Menu_Buttons, with only the Play route active for Phase 3.
5. THE SnoopsGem_Game SHALL exclude world map, shop, currency, lives, achievements, audio, persistence, backend, authentication, and multiplayer systems from Phase 3, such that none of these systems is implemented, initialized, or reachable through any Phase 3 interaction.

### Requirement 47: Phase 3 Completion Criteria

**User Story:** As a Developer, I want explicit completion criteria, so that Phase 3 is verifiably done.

#### Acceptance Criteria

1. THE SnoopsGem_Game SHALL implement every Phase 3 requirement from Requirement 26 through Requirement 46.
2. THE SnoopsGem_Game test suite SHALL pass all Phase 2 tests, all Phase 3 unit tests, all Phase 3 integration tests, and all required property tests, each property test running a minimum of 100 iterations, with zero failures across the full suite.
3. THE Board_Engine SHALL produce deterministic Special_Combination effects and THE Level_Engine SHALL produce a deterministic and non-negative Score for identical inputs.
4. THE Level_Engine SHALL apply correct move accounting and correct win and lose determination, and THE Level_Engine SHALL reset a level completely on restart.
5. THE Game_Board_Screen SHALL remain responsive with zero horizontal overflow, SHALL require no swipe or drag gesture, and SHALL introduce no out-of-scope system.
6. THE SnoopsGem_Game SHALL introduce no unnecessary Phase 1 changes, such that a final review of the change set confirms only Phase 3 additions and documented required modifications.

## Phase 3 Definition of Done

Phase 3 is done when a Player can play an 8x8 level; create Line_Crystals, Rainbow_Crystals, and Bomb_Crystals; activate Special_Gems; combine Special_Gems; trigger special-gem Cascades; earn Score; track Remaining_Moves; track Objective_Progress; win a level; lose a level; restart a level; play using mouse or touch; and see all relevant gameplay state in the responsive Game_Board_Screen — while the existing Phase 2 engine and all previous tests remain intact.

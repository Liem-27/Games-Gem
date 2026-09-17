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

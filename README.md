# E-edition Cleanup

A Chromium Manifest V3 extension that hides the Pages, Articles, and
Supplements navigation and Previous Page/Next Page side buttons, removes the
reader's extra spacing, and keeps story text overlays interactive. On desktop,
use Left or Up to go to the previous page and Right or Down to go to the next
page. When the story reader overlay is open, the same arrow keys navigate to
the previous or next article. The story overlay includes a button to copy the
story text and photos as rich clipboard content.

## Configure sites

Open the extension's **Details** page in `chrome://extensions` and select
**Extension options** to edit the enabled hostnames. The defaults are
`dailycamera.com` and `denverpost.com`; add one hostname per line to enable
additional sites. The browser will ask you to grant access to newly added
sites. Changes apply to pages opened or reloaded after saving.

## Install

1. Open `chrome://extensions` in Chromium.
2. Enable **Developer mode**.
3. Select **Load unpacked** and choose this folder.
4. Reload the extension and allow clipboard access if prompted.
5. Open or reload an e-edition page.


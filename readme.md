Description
===========

ftp-czm is a CLI application developed based on [ftp](https://www.npmjs.com/package/ftp) and [sftp](https://www.npmjs.com/package/ssh2-sftp-client) which provides the basic operation about FTP application such as listing files, uploading files, deleting files from server, downloading files.

Examples
========

1. Run command to connect the ftp/sftp server

```javascript
node index.js c
// or
node index.js connect
// or
npm link
czm-ftp c
```

And then the commander will inquire you for the `--type(ftp/sftp)`, `--host`, `--port`, `--user`, `--password`, `--root`. The real connection will be executed after inputing all the parameters.

Of course you can input the parameters initially on the first command like

`czm-ftp c --type ftp --host 11.11.11.11 --port 21 --user xxx --password xxx --root /xxx/`

2. After the connection has done successfully, the polling inquirement will keep asking you what action do you want to execute. 

```
请问有什么可以帮到你？（upload, download, delete, list, quit)
```
You can input the five types of commands following by the parameters you want to take action with. The upload example is shown below. 

```
upload cat.png coffee.png
```

And the other actions are also required to input like the form shown except `quit` which receive no parameter.

The following parameter can be wildcard character which will do the action for all the files matched, like 

```
upload cat.png /imgs/*
```